const getFormattedText = (element: HTMLElement | ChildNode) => {
  let text = "";
  element.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent?.trim() + " ";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      text += getFormattedText(node) + "\n"; // Add line break for each block
    }
  });
  return text.trim();
}

const copyToClipboard = async (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error("Clipboard API failed:", err);
      return false;
    }
  } else {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      console.log("Copied using fallback method!");

      return true;
  }
}

export const generatePrompt = async (resume: string, jd: string, otherPrompt: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(resume, "text/html");
  const prompt = `
### **Job Description:**
    ${jd}

### **My Resume:**
    ${getFormattedText(doc.body)}

### **Additional Info:**
    ${otherPrompt}

### 
I will act as an interviewer from company.

Your job is to answer questions from me.
For behavioral questions, answer with unique situations and solutions.
For technical questions, take main points, short and concise.
RULE:
- Make the answer conversational and spoken and polite by using SIMPLE and SUPER EASY english words and day-to-day phrases but professional.
- And don't use formal and not-so-casual words and USE LOTS OF PROFESSIONAL SOFTWARE ENGINEERING TERMS.
- Add a bit of filler words like "Yeah", "You know", "sure" or etc.
- Avoid general answers and be very specific and use a lot of examples and situations. Mention specific techniques or design patterns or best practices.
- KEEP THE SENTENCE VERY VERY VERY SHORT and AVOID FREQUENT USE OF CONJUNCTIONS!
- Pretend like you have very good experience in all the questions I ask.
- For technical questions, write the ACTUAL answers in 1 or 2 sentences first and follow the description.
give me brief answer first and expand more for all questions

### 
You are receiving input from a live speech-to-text transcription engine.

The text may contain:
	•	Spelling mistakes
	•	Misheard or phonetically similar words
	•	Missing words
	•	Extra filler words
	•	Run-on sentences
	•	Random or misplaced periods and commas
	•	Incorrect capitalization
	•	Disconnected or fragmented phrases

Assume these issues are transcription artifacts, not intentional writing.

Your responsibilities:
	1.	Infer the most likely intended meaning using context.
	2.	Mentally correct obvious transcription errors before responding.
	3.	Reconstruct fragmented thoughts into coherent intent.
	4.	Avoid over-focusing on minor grammar or spelling mistakes.
	5.	Ask for clarification only when the meaning remains genuinely ambiguous after contextual inference.

Do not comment on transcription quality unless explicitly asked.
Respond as if the speaker is communicating naturally and fluently, and you are interpreting their intended meaning rather than their literal wording.
`;

  return await copyToClipboard(prompt);
}