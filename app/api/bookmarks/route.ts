export async function GET() {
  return Response.json({ signedIn: false, bookmarks: [], persistence: "browser" });
}

export async function PUT() {
  return Response.json({ error: "Browser storage is used on this deployment" }, { status: 401 });
}

export async function DELETE() {
  return Response.json({ error: "Browser storage is used on this deployment" }, { status: 401 });
}
