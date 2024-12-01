import fastify, { FastifyRequest } from "fastify";
// import { ChatOpenAI } from "langchain/chat_models/openai";
import OpenAI from "openai";
const server = fastify();

// import postgres from "@fastify/postgres";

// const chat = new ChatOpenAI({
//   modelName: "gpt-4",
//   openAIApiKey: Bun.env.OPEN_API_KEY,
// });

// server.register(postgres, {
//   connectionString: Bun.env.CONNECTION_STRING,
// });

// server.post(
//   "/ping",
//   async (request: FastifyRequest<{ Body: { question: string } }>, reply) => {
//     const client = await server.pg.connect();
//     const conversationId = request.headers["x-forwarded-for"];

//     try {
//       await client.query(
//         "INSERT INTO conversation (conversation_id, content) VALUES ($1, $2)",
//         [conversationId, request.body.question]
//       );
//     } catch (error) {
//       reply.status(500).send("Error while adding conversation_id");
//     }

//     let conversation = [] as string[];

//     try {
//       const result = await client.query(
//         `SELECT content FROM conversation WHERE conversation_id ='${conversationId}'`
//       );
//       result.rows.forEach((row) => {
//         conversation.push(row.content);
//       });
//     } catch (err) {
//       console.error("Error fetching conversation IDs:", err);
//       reply.status(500).send("Error fetching conversation IDs");
//     }

//     const { content } = await chat.call([
//       new SystemMessage("Be ultra-concise." + conversation.join("\n")),
//       new HumanMessage(request.body.question),
//     ]);

//     reply.send({ reply: content });
//   }
// );

// server.post(
//   "/serp",
//   async (request: FastifyRequest<{ Body: { question: string } }>, reply) => {
//     const response = await getJson({
//       engine: "google",
//       api_key: Bun.env.SERP_API_KEY,
//       q: request.body.question,
//     });

//     reply.send({ reply: response["organic_results"][0].link });
//   }
// );

server.post(
  "/map",
  async (request: FastifyRequest<{ Body: { instruction: string } }>, reply) => {
    const openAI = new OpenAI({
      apiKey: Bun.env.OPEN_API_KEY,
    });

    console.log(request.body.instruction);

    const mapLocations = [
      ["Punkt lokalizacyjny", "Dzika trawa", "Samotne drzewo", "Wiejski dom"],
      ["Dzika trawa", "Stary wiatrak", "Dzika trawa", "Dzika trawa"],
      ["Dzika trawa", "Dzika trawa", "Skaliste wzgórza", "Dwa drzewa"],
      [
        "strome góry",
        "Górskie szczyty",
        "Zaparkowany samochód",
        "Wejście jaskini",
      ],
    ];
    const systemPrompt = `
    You are a precise navigation interpreter for a 4x4 grid-based drone system. The grid is structured as follows:

[0,0] [0,1] [0,2] [0,3]
[1,0] [1,1] [1,2] [1,3]
[2,0] [2,1] [2,2] [2,3]
[3,0] [3,1] [3,2] [3,3]

Starting position: [0,0] (top-left corner)
Grid boundaries: 0 ≤ row ≤ 3 and 0 ≤ column ≤ 3

Your role:
1. Parse natural language movement descriptions
2. Track position changes considering:
   - Sequence of movements
   - Canceled or reversed commands
   - "Start over" instructions
   - Movement boundaries (cannot move outside 4x4 grid)
3. Calculate final position after all valid movements

Input: Natural language description of movements
Output: JSON object containing final coordinates
{
    "row": <final_row>,
    "col": <final_col>
}

Rules:
- Only process the final, valid sequence of movements
- Ignore irrelevant commentary or ambiguous instructions
- Movements that would go beyond grid boundaries are ignored
- If "start over" is mentioned, reset position to [0,0] and only consider subsequent movements
- Return strictly formatted JSON without additional text or markdown.
    `;
    const chatAnswer = await openAI.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: request.body.instruction,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const parsed = JSON.parse(chatAnswer.choices[0].message.content as string);

    const row = parsed.row as any;
    const col = parsed.col as any;

    console.log("ANSWER", { description: mapLocations[row][col], row, col });

    reply.send({ description: mapLocations[row][col] });
  }
);

server.listen({ port: 50419, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});
