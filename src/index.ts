import fastify from "fastify";

const server = fastify();

import postgres from "@fastify/postgres";

server.register(postgres, {
  connectionString:
    "postgresql://postgres:postgres@host.docker.internal:5432/postgres",
});

server.get("/ping", async (request, reply) => {
  const client = await server.pg.connect();
  return "pong\n";
});

server.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
