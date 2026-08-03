import { generate } from "@/lib/llm/ollama";
import { getContext } from "@/lib/context";
import { buildPrompt } from "@/lib/prompts/builder";


export async function POST(req: Request) {

  const {
    question,
    contextMode,
    conversationId
  } = await req.json();


  const context = await getContext({ 
    mode: contextMode,
    conversationId,
    question
  });


  const prompt = buildPrompt({
    question,
    context
  });


  const answer = await generate(prompt);


  return Response.json({
    answer
  });
}