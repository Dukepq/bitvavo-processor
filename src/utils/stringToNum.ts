export default function stringToNum(value: string, precision?: number): number {
  const converted = Number(value);
  if (isNaN(converted)) {
    throw new Error("provided string cannot be converted to a number");
  }
  return precision ? parseFloat(converted.toPrecision(precision)) : converted;
}
