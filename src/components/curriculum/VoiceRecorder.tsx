'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

/** `new MediaRecorder(stream)` with no explicit mimeType lets the browser pick its own default
 * container -- on Chrome/Edge that's often "video/webm" even for an audio-only stream (no video
 * track, just the container format's own default label). The upload's allowedContentTypes only
 * lists audio/* types, so an unrequested video/webm blob was being rejected outright by Vercel
 * Blob ("Content type mismatch"). Requesting an audio-only mimeType explicitly, in the order a
 * browser is actually likely to support it, avoids ever producing that mismatch in the first
 * place. */
function pickAudioMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return candidates.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(t));
}

/** The Web Speech API's SpeechRecognition isn't in TypeScript's DOM lib (only a few of its
 * supporting sub-interfaces are) and ships under a vendor-prefixed global in Chrome/Edge --
 * this is the minimal shape this component actually uses, not the full spec. */
interface MinimalSpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string };
}
interface MinimalSpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: { length: number; [index: number]: MinimalSpeechRecognitionResult };
}
interface MinimalSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: MinimalSpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

function getSpeechRecognitionCtor(): (new () => MinimalSpeechRecognition) | undefined {
  const w = window as unknown as {
    SpeechRecognition?: new () => MinimalSpeechRecognition;
    webkitSpeechRecognition?: new () => MinimalSpeechRecognition;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

/** Records a spoken answer with the browser's own MediaRecorder (no server-side speech processing
 * — a teacher listens to it directly when marking), then uploads it the same way every other
 * student file goes up (see /api/student/upload). pathPrefix should be unique per question/child
 * (e.g. `children/{childId}/lesson-answers/{questionId}`) so re-recording doesn't collide with a
 * previous attempt mid-upload.
 *
 * onTranscript is optional and only used where there's an actual text box to fill (the quiz
 * open-response question, not the plain worksheet-submission recorder) -- when given, this also
 * starts the browser's own live SpeechRecognition alongside MediaRecorder (same no-server-call,
 * no-API-key approach as ReadAloudButton's SpeechSynthesis) and reports the running dictated text
 * for this recording session as it comes in. Unsupported browsers (Firefox, some Safari versions)
 * just never fire it -- recording and saving the audio itself never depends on dictation working. */
export default function VoiceRecorder({
  pathPrefix,
  uploadEndpoint,
  onRecorded,
  onRecordingStart,
  onTranscript,
}: {
  pathPrefix: string;
  uploadEndpoint?: string;
  onRecorded: (audioUrl: string) => void;
  /** Fired the moment recording starts, before the transcript begins updating -- lets a caller
   * that also has a text box snapshot "what was already typed" so dictated text can be appended
   * rather than overwriting it. */
  onRecordingStart?: () => void;
  onTranscript?: (text: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dictating, setDictating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);

  async function start() {
    setError(null);
    onRecordingStart?.();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setPreviewUrl(URL.createObjectURL(blob));
        setUploading(true);
        try {
          const actualMimeType = recorder.mimeType || 'audio/webm';
          const ext = actualMimeType.includes('mp4') ? 'm4a' : actualMimeType.includes('ogg') ? 'ogg' : 'webm';
          const result = await upload(`${pathPrefix}/answer-${Date.now()}.${ext}`, blob, {
            access: 'public',
            handleUploadUrl: uploadEndpoint || '/api/student/upload',
          });
          onRecorded(result.url);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to upload recording.');
        } finally {
          setUploading(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);

      if (onTranscript) {
        const RecognitionCtor = getSpeechRecognitionCtor();
        if (RecognitionCtor) {
          const recognition = new RecognitionCtor();
          recognition.continuous = true;
          recognition.interimResults = true;
          let finalTranscript = '';
          recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              const chunk = result[0]?.transcript ?? '';
              if (result.isFinal) finalTranscript += `${chunk} `;
              else interim += chunk;
            }
            onTranscript(`${finalTranscript}${interim}`.trim());
          };
          // Dictation is a bonus, not a requirement -- any error here (no speech detected, mic
          // busy, network hiccup for the browser's own recognition service) is silently ignored;
          // the recording itself keeps going regardless.
          recognition.onerror = () => setDictating(false);
          recognitionRef.current = recognition;
          recognition.start();
          setDictating(true);
        }
      }
    } catch {
      setError('Could not access the microphone — check your browser permissions.');
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setDictating(false);
    setRecording(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {!recording ? (
          <button
            type="button"
            onClick={start}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-full bg-orange-deep px-4 py-2 text-sm font-bold text-white hover:bg-orange disabled:opacity-50"
          >
            🎙️ {previewUrl ? 'Record again' : 'Record your answer'}
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Stop recording
          </button>
        )}
        {recording && dictating && <span className="text-xs font-semibold text-teal-deep">Listening…</span>}
        {uploading && <span className="text-xs text-ink-soft">Saving…</span>}
      </div>
      {previewUrl && !recording && <audio controls src={previewUrl} className="w-full max-w-xs" />}
      {error && <p className="text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
