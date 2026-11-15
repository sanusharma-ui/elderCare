import { successResponse } from "@/lib/api-response";

export async function GET() {
  return successResponse({
    status: "healthy",
    service: "CareSaathi Elderly Care & Medication Management Platform API",
    version: "1.0.0",
    stage: 1,
    timestamp: new Date().toISOString(),
  });
}
