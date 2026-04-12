export interface SwapRequest {
  moduleName: string;
  fromVersion: string;
  toVersion: string;
}

export interface SwapResult {
  status: "idle" | "validating" | "swapping" | "blocked" | "rolled_back";
  request: SwapRequest;
  reason?: string;
}

export class SwapController {
  validate(request: SwapRequest): SwapResult {
    if (request.fromVersion === request.toVersion) {
      return {
        status: "blocked",
        request,
        reason: "fromVersion and toVersion are identical",
      };
    }

    return {
      status: "validating",
      request,
    };
  }

  swap(request: SwapRequest): SwapResult {
    return {
      status: "swapping",
      request,
    };
  }

  rollback(request: SwapRequest): SwapResult {
    return {
      status: "rolled_back",
      request,
    };
  }
}

export const swapController = new SwapController();
