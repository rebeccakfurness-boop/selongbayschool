import type { ContentGenerationProvider } from './types';

/** Throws immediately on every method -- this app has no LLM SDK dependency and no API key
 * configured (see the ContentGenerationProvider interface's own comment), so there's nothing
 * real to plug in yet. generate() takes a provider as an explicit argument specifically so a real
 * one (an Anthropic/OpenAI client wrapped in this interface, once one exists in this codebase)
 * can be passed in without changing anything else in the pipeline -- swap the argument, not the
 * orchestration. Exists so callers get a clear, actionable error instead of a missing-argument
 * TypeError if generate() is ever invoked before that's done. */
export class NotConfiguredProvider implements ContentGenerationProvider {
  private fail(method: string): never {
    throw new Error(
      `Curriculum generation engine has no ContentGenerationProvider configured (${method} was called). ` +
        'Wire up a real provider (an LLM client implementing ContentGenerationProvider from ' +
        'src/lib/curriculum-generation/types.ts) and pass it to generateCurriculumTerm() before running this.'
    );
  }

  async parseSyllabus(): Promise<never> {
    this.fail('parseSyllabus');
  }

  async analyzeWorkbook(): Promise<never> {
    this.fail('analyzeWorkbook');
  }

  async generateUnit(): Promise<never> {
    this.fail('generateUnit');
  }
}
