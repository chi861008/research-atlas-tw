export async function GET() {
  return Response.json({ signedIn: false, projects: [], persistence: "browser" });
}

export async function POST() {
  return Response.json({ error: "Browser storage is used on this deployment" }, { status: 401 });
}

export async function DELETE() {
  return Response.json({ error: "Browser storage is used on this deployment" }, { status: 401 });
}
