import Anthropic from '@anthropic-ai/sdk';
import type {
  ContentGenerationProvider,
  ParsedSyllabus,
  WorkbookAnalysis,
  GeneratedUnit,
} from './types';

/** claude-sonnet-5, not the default claude-opus-5 -- an explicit, cost-driven choice (this runs
 * across many subjects, not just one course), made by a human request, not by this provider's own
 * judgment. Sonnet 5 supports the same adaptive-thinking + forced tool-use pattern this file uses
 * (see the drift table in the claude-api skill: budget_tokens is rejected on Sonnet 5 exactly as
 * on Opus 5, and thinking: {type: "adaptive"} is the replacement on both), so nothing else in this
 * file needed to change. */
const MODEL = 'claude-sonnet-5';

function getClient(): Anthropic {
  // Resolves ANTHROPIC_API_KEY from the environment -- see this provider's own class comment for
  // what happens when it isn't set.
  return new Anthropic();
}

/** Every JSON Schema property below gets a `description` -- Claude uses these the same way it
 * uses a tool's own description, and this schema is standing in for a whole authoring brief (what
 * a good worked example looks like, what a "kicker" is for) that would otherwise have to live in
 * the prompt text instead. */

const SUBTOPIC_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'Short stable id, e.g. "2.4"' },
    title: { type: 'string' },
    description: { type: 'string' },
  },
  required: ['id', 'title'],
  additionalProperties: false,
};

const TOPIC_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'Short stable id, e.g. "topic-2" or "2"' },
    title: { type: 'string' },
    description: { type: 'string' },
    assessmentObjectives: { type: 'array', items: { type: 'string' } },
    subtopics: { type: 'array', items: SUBTOPIC_SCHEMA, description: 'One level of subtopics only.' },
  },
  required: ['id', 'title'],
  additionalProperties: false,
};

const PARSE_SYLLABUS_SCHEMA = {
  type: 'object',
  properties: {
    subject: { type: 'string' },
    frameworkLabel: { type: 'string', description: 'e.g. "Cambridge IGCSE" or "AQA GCSE"' },
    topicTree: { type: 'array', items: TOPIC_SCHEMA, description: 'Every top-level syllabus topic, in syllabus order.' },
    assessmentObjectives: { type: 'array', items: { type: 'string' } },
    components: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'e.g. "Paper 1: Multiple Choice"' },
          description: { type: 'string' },
          weightingPercent: { type: 'number' },
        },
        required: ['name'],
        additionalProperties: false,
      },
    },
  },
  required: ['subject', 'topicTree', 'assessmentObjectives', 'components'],
  additionalProperties: false,
};

const WORKBOOK_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    masterySignals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topicId: { type: 'string', description: 'Must match one of the given topicTree ids.' },
          topicTitle: { type: 'string' },
          evidence: { type: 'string', description: 'Why this looks already mastered, shown verbatim to the teacher.' },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['topicId', 'topicTitle', 'evidence', 'confidence'],
        additionalProperties: false,
      },
    },
  },
  required: ['masterySignals'],
  additionalProperties: false,
};

const BASE_STEP_PROPS = {
  id: { type: 'string', description: 'Stable within this lesson, e.g. "step-1".' },
  kicker: { type: 'string', description: 'Short eyebrow label, e.g. "New idea" or "Now you try".' },
  title: { type: 'string' },
  lede: { type: 'string', description: 'Intro paragraph shown below the title, before the widget.' },
};

function stepVariant(typeName: string, description: string, extraProps: Record<string, unknown>, required: string[]) {
  return {
    type: 'object',
    description,
    properties: { type: { type: 'string', const: typeName }, ...BASE_STEP_PROPS, ...extraProps },
    required: ['type', 'id', ...required],
    additionalProperties: false,
  };
}

const INTERACTIVE_STEP_SCHEMA = {
  oneOf: [
    stepVariant(
      'explanation',
      'A new concept explained with a definition and a worked/real-world example. Must appear before any later step whose testsConceptIds includes this step\'s conceptId.',
      {
        conceptId: { type: 'string', description: 'Set this when a later step tests understanding of this concept.' },
        definition: { type: 'string' },
        example: { type: 'string' },
      },
      ['definition', 'example']
    ),
    stepVariant(
      'flip_card',
      'A grid of several term/definition flip cards shown together (never just one).',
      {
        cards: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: { term: { type: 'string' }, hint: { type: 'string' }, definition: { type: 'string' } },
            required: ['term', 'definition'],
            additionalProperties: false,
          },
        },
        testsConceptIds: { type: 'array', items: { type: 'string' } },
      },
      ['cards']
    ),
    stepVariant(
      'guess_reveal',
      'A set of guess-then-reveal cards (a question, then an answer revealed on tap) shown together.',
      {
        cards: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
              tags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { label: { type: 'string' }, tone: { type: 'string', enum: ['up', 'down', 'neutral'] } },
                  required: ['label', 'tone'],
                  additionalProperties: false,
                },
              },
            },
            required: ['question', 'answer'],
            additionalProperties: false,
          },
        },
        testsConceptIds: { type: 'array', items: { type: 'string' } },
      },
      ['cards']
    ),
    stepVariant(
      'sort_classify',
      'A drag/tap sorting activity: items get classified into named categories, each with a reason shown after answering.',
      {
        categories: { type: 'array', items: { type: 'string' }, minItems: 2 },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              correctCategory: { type: 'string', description: 'Must match one of the given categories exactly.' },
              reason: { type: 'string', description: 'Shown once answered, correct or not.' },
            },
            required: ['id', 'label', 'correctCategory', 'reason'],
            additionalProperties: false,
          },
        },
        testsConceptIds: { type: 'array', items: { type: 'string' } },
      },
      ['categories', 'items']
    ),
    stepVariant(
      'tap_reveal_grid',
      'A clickable grid of cards that reveal more detail on tap (e.g. "Characteristics of X").',
      {
        cards: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              icon: { type: 'string', description: 'A single emoji.' },
              label: { type: 'string' },
              content: { type: 'string' },
            },
            required: ['id', 'label', 'content'],
            additionalProperties: false,
          },
        },
      },
      ['cards']
    ),
    stepVariant(
      'worked_example',
      'A numbered worked-example walkthrough; the last row is auto-highlighted as the final answer.',
      {
        steps: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: { label: { type: 'string' }, detail: { type: 'string', description: 'Typically the actual working/calculation line.' } },
            required: ['label', 'detail'],
            additionalProperties: false,
          },
        },
        testsConceptIds: { type: 'array', items: { type: 'string' } },
      },
      ['steps']
    ),
    stepVariant(
      'interactive_calculator',
      'A set of scenario buttons that swap between pre-computed readouts -- values must already be calculated, never a formula to evaluate live.',
      {
        scenarios: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              readouts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { label: { type: 'string' }, value: { type: 'string' } },
                  required: ['label', 'value'],
                  additionalProperties: false,
                },
              },
            },
            required: ['id', 'label', 'readouts'],
            additionalProperties: false,
          },
        },
      },
      ['scenarios']
    ),
    stepVariant(
      'data_table',
      'A plain data table, optionally highlighting one row (e.g. the profit-maximising row).',
      {
        columns: { type: 'array', items: { type: 'string' } },
        rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
        highlightRowIndex: { type: 'integer' },
      },
      ['columns', 'rows']
    ),
    stepVariant(
      'proportional_bar_compare',
      'A bar-chart-style comparison of a few values.',
      {
        unit: { type: 'string' },
        items: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'number' },
              tone: { type: 'string', enum: ['teal', 'orange', 'lightteal'] },
            },
            required: ['label', 'value'],
            additionalProperties: false,
          },
        },
      },
      ['items']
    ),
    stepVariant(
      'quiz',
      "A reference to this lesson's own starter or exit quiz -- use at most one 'starter' and one 'exit' quiz step per lesson.",
      { quizType: { type: 'string', enum: ['starter', 'exit'] } },
      ['quizType']
    ),
    stepVariant(
      'inline_quiz',
      'Several short ungraded questions shown together with instant per-question feedback (a quick recap check, not the formal quiz).',
      {
        questions: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              options: { type: 'array', items: { type: 'string' }, minItems: 2 },
              correctOptionIndex: { type: 'integer' },
              feedback: { type: 'string', description: 'Shown after answering, e.g. explaining why the answer is right.' },
            },
            required: ['question', 'options', 'correctOptionIndex', 'feedback'],
            additionalProperties: false,
          },
        },
        testsConceptIds: { type: 'array', items: { type: 'string' } },
      },
      ['questions']
    ),
    stepVariant(
      'recap_checklist',
      "The lesson's closing recap -- always the last step.",
      {
        summaryPoints: { type: 'array', items: { type: 'string' } },
        homeworkItems: { type: 'array', items: { type: 'string' } },
      },
      ['summaryPoints', 'homeworkItems']
    ),
  ],
};

const TEACHING_SCRIPT_SCHEMA = {
  type: 'object',
  description: 'Never shown to a student -- notes for the teacher actually running the lesson.',
  properties: {
    overview: { type: 'string' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          stepId: { type: 'string', description: "Must match one of this lesson's interactiveContent step ids." },
          talkingPoints: { type: 'array', items: { type: 'string' } },
          timingMinutes: { type: 'number' },
          misconceptions: { type: 'array', items: { type: 'string' } },
        },
        required: ['stepId', 'talkingPoints'],
        additionalProperties: false,
      },
    },
  },
  required: ['overview', 'steps'],
  additionalProperties: false,
};

const WORKSHEET_CONTENT_SCHEMA = {
  type: 'object',
  description: 'The printable worksheet a student takes away from this lesson.',
  properties: {
    title: { type: 'string' },
    instructions: { type: 'string' },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          marks: { type: 'integer' },
          answer: { type: 'string', description: 'Omit for a question with no single correct answer to check.' },
        },
        required: ['prompt'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'questions'],
  additionalProperties: false,
};

const GENERATED_LESSON_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    objectives: { type: 'string', description: "This lesson's learning objectives, shown to the teacher." },
    interactiveContent: {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          minItems: 4,
          items: INTERACTIVE_STEP_SCHEMA,
          description:
            'An ordered lesson sequence: typically explanation step(s) before any step testing that concept, then practice, then a recap_checklist step last.',
        },
      },
      required: ['steps'],
      additionalProperties: false,
    },
    teachingScript: TEACHING_SCRIPT_SCHEMA,
    quizQuestions: {
      type: 'array',
      description: 'A mix of starter and exit multiple-choice questions.',
      items: {
        type: 'object',
        properties: {
          quizType: { type: 'string', enum: ['starter', 'exit'] },
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 6 },
          correctOptionIndex: { type: 'integer' },
          hint: { type: 'string' },
        },
        required: ['quizType', 'question', 'options', 'correctOptionIndex'],
        additionalProperties: false,
      },
    },
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        properties: { term: { type: 'string' }, definition: { type: 'string' } },
        required: ['term', 'definition'],
        additionalProperties: false,
      },
    },
    calculationChecks: {
      type: 'array',
      description:
        'Only for a lesson with a numeric worked example -- one entry per stated worked answer, so it can be verified against the stated inputs.',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          expression: { type: 'string', description: 'Plain arithmetic using the stated input values, e.g. "12 * 0.15".' },
          expectedResult: { type: 'number' },
        },
        required: ['description', 'expression', 'expectedResult'],
        additionalProperties: false,
      },
    },
    phase: { type: 'string', enum: ['content', 'review', 'revision', 'exam_skill', 'past_paper', 'buffer'] },
    syllabusRef: { type: 'string', description: 'e.g. "2.4.3" or "2.4.3 / 2.5" -- can name more than one syllabus point.' },
    worksheetContent: WORKSHEET_CONTENT_SCHEMA,
  },
  required: ['title', 'objectives', 'interactiveContent', 'teachingScript', 'quizQuestions', 'flashcards', 'worksheetContent'],
  additionalProperties: false,
};

const GENERATE_UNIT_SCHEMA = {
  type: 'object',
  properties: {
    topicId: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    lessons: { type: 'array', items: GENERATED_LESSON_SCHEMA },
  },
  required: ['topicId', 'title', 'lessons'],
  additionalProperties: false,
};

function explainAnthropicError(err: unknown): Error {
  if (err instanceof Anthropic.AuthenticationError) {
    return new Error('Anthropic API key is missing or invalid (check ANTHROPIC_API_KEY in the Vercel project settings).');
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new Error('Anthropic API rate limit hit -- try again shortly.');
  }
  if (err instanceof Anthropic.APIError) {
    return new Error(`Anthropic API error (${err.status}): ${err.message}`);
  }
  return err instanceof Error ? err : new Error(String(err));
}

/** Sends one non-agentic request forcing Claude to call `toolName` with input matching
 * `inputSchema`, and returns that call's `input` -- the standard "extract structured data"
 * pattern (tool_choice: {type: "tool", name}) rather than the beta tool runner, since this never
 * needs a multi-turn loop: one call in, one structured object out. */
async function callForStructuredOutput<T>(params: {
  system: string;
  userContent: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const client = getClient();
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: params.maxTokens ?? 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system: params.system,
      tools: [{ name: params.toolName, description: params.toolDescription, input_schema: params.inputSchema as Anthropic.Tool.InputSchema }],
      tool_choice: { type: 'tool', name: params.toolName },
      messages: [{ role: 'user', content: params.userContent }],
    });

    const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!toolUse) {
      throw new Error(`Claude did not call ${params.toolName} (stop_reason: ${response.stop_reason}).`);
    }
    return toolUse.input as T;
  } catch (err) {
    throw explainAnthropicError(err);
  }
}

/** The real, LLM-backed ContentGenerationProvider -- see ContentGenerationProvider's own comment
 * in ./types for the interface this fills in. Every call is forced through a single tool
 * (tool_choice: {type: "tool", ...}) whose input_schema mirrors this module's own TypeScript
 * types exactly, so what comes back is already shaped like ParsedSyllabus/WorkbookAnalysis/
 * GeneratedUnit -- no separate "ask for JSON, hope it parses" step. Every generated lesson still
 * goes through generate.ts's own validateStepOrdering/checkCalculations and lands at
 * review_status = 'needs_review', exactly as StaticContentGenerationProvider's content does --
 * this class only changes where the content comes from, never the review gate around it. */
export class AnthropicContentGenerationProvider implements ContentGenerationProvider {
  async parseSyllabus(input: { syllabusText: string; subject: string }): Promise<ParsedSyllabus> {
    return callForStructuredOutput<ParsedSyllabus>({
      system:
        'You are an experienced exam-board curriculum specialist. Read the supplied syllabus document text carefully and ' +
        'extract its real structure -- do not invent topics that are not in the document.',
      userContent:
        `Subject: ${input.subject}\n\nExtract the full topic tree (top-level topics, each with one level of subtopics), ` +
        `the assessment objectives, and the paper/component structure from this syllabus text:\n\n${input.syllabusText}`,
      toolName: 'record_parsed_syllabus',
      toolDescription: "Records the syllabus's parsed structure.",
      inputSchema: PARSE_SYLLABUS_SCHEMA,
      maxTokens: 8000,
    });
  }

  async analyzeWorkbook(input: { workbookText: string; topicTree: { id: string; title: string }[] }): Promise<WorkbookAnalysis> {
    return callForStructuredOutput<WorkbookAnalysis>({
      system:
        'You are an experienced teacher reviewing a workbook a class has already completed, to spot which syllabus topics ' +
        'look already mastered. Every signal you report is a proposal a teacher will confirm before anything is skipped -- ' +
        'when in doubt, omit a topic rather than over-claiming mastery.',
      userContent:
        `Syllabus topics:\n${input.topicTree.map((t) => `- ${t.id}: ${t.title}`).join('\n')}\n\n` +
        `Workbook content:\n\n${input.workbookText}`,
      toolName: 'record_workbook_analysis',
      toolDescription: 'Records which syllabus topics the workbook suggests are already mastered.',
      inputSchema: WORKBOOK_ANALYSIS_SCHEMA,
      maxTokens: 4000,
    });
  }

  async generateUnit(input: {
    topic: { id: string; title: string; description?: string; subtopics?: { id: string; title: string }[] };
    subject: string;
    className: string;
    lessonCount: number;
    exampleContext: { interests: string[]; localReferences: string[] };
    assessmentObjectives: string[];
  }): Promise<GeneratedUnit> {
    const contextLines: string[] = [];
    if (input.exampleContext.interests.length > 0) {
      contextLines.push(`Class interests to draw examples from where natural: ${input.exampleContext.interests.join(', ')}.`);
    }
    if (input.exampleContext.localReferences.length > 0) {
      contextLines.push(`Local references to draw on where natural: ${input.exampleContext.localReferences.join(', ')}.`);
    }

    return callForStructuredOutput<GeneratedUnit>({
      system:
        `You are an outstanding ${input.subject} teacher writing a complete, ready-to-teach unit for ${input.className}. ` +
        'Every lesson must be genuinely teachable as written: real explanations with worked examples (not placeholders), ' +
        'a full interactive step sequence (an explanation step must appear before any step that tests it, and every lesson ' +
        'ends with a recap_checklist step), a full teaching script for the teacher, starter and exit quiz questions, ' +
        'flashcards for key terms, and a complete worksheet with an answer key. Every worksheet question with a single ' +
        'correct answer must include that answer. For any lesson with a numeric worked example, include calculationChecks ' +
        'covering every stated worked answer.',
      userContent:
        `Topic: ${input.topic.title} (id: ${input.topic.id})${input.topic.description ? `\n${input.topic.description}` : ''}\n` +
        (input.topic.subtopics?.length ? `Subtopics: ${input.topic.subtopics.map((s) => `${s.id} ${s.title}`).join('; ')}\n` : '') +
        `Assessment objectives: ${input.assessmentObjectives.join(', ')}\n` +
        `Write exactly ${input.lessonCount} lesson(s) for this topic.\n` +
        (contextLines.length > 0 ? `${contextLines.join(' ')}\n` : ''),
      toolName: 'record_generated_unit',
      toolDescription: 'Records one fully-authored teaching unit and its lessons.',
      inputSchema: GENERATE_UNIT_SCHEMA,
      maxTokens: 32000,
    });
  }
}
