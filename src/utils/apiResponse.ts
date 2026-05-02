
import { apiResponse } from "../types/types";

function respond<responseData>(success: boolean, message: string, data: responseData) {
  const response: apiResponse<responseData> = {
    success,
    message,
    data
  }

  return response;
}

export default respond;