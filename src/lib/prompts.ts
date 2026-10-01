export const USER_TAG = "pregunta_del_usuario";
export const FICHA_TAG = "ficha_oficial";

const TAG_RE = new RegExp(`</?(?:${USER_TAG}|${FICHA_TAG})>`, "g");

/**
 * User text is data, never instructions: every LLM call wraps it in these tags.
 * The tag literals themselves are stripped so a crafted question cannot close the
 * block early and pose as system content.
 */
export function userBlock(question: string): string {
  const safe = question.replace(TAG_RE, "");
  return `<${USER_TAG}>\n${safe}\n</${USER_TAG}>`;
}

/** The summarizer prompt: tagged question, tagged official ficha, nothing else. */
export function answerPrompt(question: string, fichaJson: string): string {
  return `${userBlock(question)}\n\n<${FICHA_TAG}>\n${fichaJson}\n</${FICHA_TAG}>`;
}
