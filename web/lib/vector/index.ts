async function generateEmbedding(text: string) {
   // call Ollama mxbai-embed-large
   

}

async function indexMessage(...) {
   const embedding = await generateEmbedding(content);

   // send embedding to Chroma
}