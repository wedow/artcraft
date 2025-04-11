export function parseQueueData(data: any, indent: number) {
  if (data === undefined || data === null) {
    return "None";
  }
  if (typeof data === "object") {
    return (
      <div className="relative">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} style={{ paddingLeft: 8 * indent }}>
            {key}: {parseQueueData(value, indent + 1)}
          </div>
        ))}
      </div>
    );
  }
  return data.toString();
}
