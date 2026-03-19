const fs = require('fs');
const file = './src/data/prompt-engineering-deck.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const mapping = {
  "zero-shot": {
    title: "Zero-shot Prompting",
    scenario: "零样本提示"
  },
  "few-shot": {
    title: "Few-shot Prompting",
    scenario: "少样本提示"
  },
  "cot": {
    title: "Chain-of-Thought Prompting",
    scenario: "链式思考提示"
  },
  "cot-transaction": {
    title: "Chain-of-Thought Prompting (Extension)",
    scenario: "零样本 CoT 延伸实战"
  },
  "meta-prompting": {
    title: "Meta Prompting",
    scenario: "元提示"
  },
  "self-consistency": {
    title: "Self-Consistency",
    scenario: "一致性自检"
  },
  "generated-knowledge": {
    title: "Generated Knowledge Prompting",
    scenario: "生成知识提示"
  },
  "prompt-chaining": {
    title: "Prompt Chaining",
    scenario: "提示链"
  },
  "tot": {
    title: "Tree of Thoughts (ToT)",
    scenario: "思维树提示"
  },
  "rag": {
    title: "Retrieval-Augmented Generation (RAG)",
    scenario: "检索增强生成"
  },
  "art": {
    title: "ART · Automatic Reasoning and Tool-use",
    scenario: "自动推理并使用工具 (Automatic Reasoning and Tool-use, ART)"
  },
  "ape": {
    title: "Automatic Prompt Engineer (APE)",
    scenario: "自动提示工程"
  },
  "active-prompt": {
    title: "Active-Prompt",
    scenario: "主动提示"
  },
  "directional-stimulus": {
    title: "Directional Stimulus Prompting",
    scenario: "方向性刺激提示"
  },
  "react": {
    title: "ReAct Framework",
    scenario: "ReAct 框架"
  },
  "reflexion": {
    title: "Reflexion",
    scenario: "反思框架"
  }
};

data.slides.forEach(slide => {
  if (mapping[slide.id]) {
    slide.title = mapping[slide.id].title;
    if (slide.payload && slide.payload.scenario) {
      slide.payload.scenario = mapping[slide.id].scenario;
    }
  }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("JSON updated successfully!");
