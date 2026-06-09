export function getOrigin(request: Request): string {
    const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
    const host =
        request.headers.get('x-forwarded-host')?.split(',')[0].trim() ??
        request.headers.get('host');
    if (proto && host) return `${proto}://${host}`;
    return new URL(request.url).origin;
}
