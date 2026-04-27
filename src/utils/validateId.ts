import { validate as isUUID } from "uuid";
import respond from "./apiResponse";

function validateId(id: string): { success: boolean; message: string; data?: null } | undefined {

  if (!isUUID(id)) {
    const response = respond(false, "Invalid id", null);
    return response;
  }

  return respond(true, "Valid id", null);
}

export default validateId;