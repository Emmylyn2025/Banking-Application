
import { apiResponse } from "../types/types";

function respond(success: boolean, message: string, data: any) {
  const response: apiResponse<typeof data> = {
    success,
    message,
    data
  }

  return response;
}

export default respond;