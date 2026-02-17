Deno.serve(async (req) => {
  return Response.json({ status: "ok" }, { status: 200 });
});