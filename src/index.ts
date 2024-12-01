import fastify, { FastifyRequest } from "fastify";
// import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import OpenAI from "openai";
import { getJson } from "serpapi";
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
      apiKey: process.env.OPENAI_API_KEY,
    });

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
    You are an expert interpreter for navigating a 4x4 grid map in a robot drone game. The map is represented as map[row][col], with [0][0] being the starting point at the top-left corner.

Your task is to analyze and interpret a human language description of movements starting from [0][0] and calculate the final position on the grid. The description may include irrelevant terms, canceled commands, or instructions to start over. Carefully process all instructions, but only consider the final decisions to determine the correct position on the grid.

Output format:
Return only the final position as a JSON object in the following format:
{  "row": <final_row>,  "col": <final_col> } 
Note: Only return the JSON coordinates, do not add any formatting like \`\`\`json\`\`\` or other comments.
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

    const row = chatAnswer.choices[0].message.content.row;
    const col = chatAnswer.choices[0].message.content.col;

    reply.send({ reply: mapLocations[row][col] });
  }
);

server.listen({ port: 50419, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});
