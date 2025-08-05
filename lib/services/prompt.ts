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
Give me my last project tailored to the job description.

**Project Requirements:**
1. Each project should have a clear **title**.
2. **members** and your role
2. A **brief description** explaining what the project does.
3. The **key skills** and technologies it demonstrates.
4. The tools and programming languages used.
5. The expected outcome or impact.
6. **project architecture**
7. **2 challenges** on this project and how to overcome that 

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
Give me answers of the following questions as professionally.

1. Talk about the high level architecture of your last project.
2. What can users do with your project?
3. Introduce yourself
4. What do you know about our company?
5. Why did you apply to this role?
6. What are you looking for your next position?
7. Salary Range of this role
`;

  return await copyToClipboard(prompt);
}