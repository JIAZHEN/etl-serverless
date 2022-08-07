import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import cors from "@middy/http-cors";

export const withDefaultMiddy = (lambdaHandler: any) =>
  middy(lambdaHandler)
    .use(httpErrorHandler())
    .use(cors({ exposeHeaders: ["X-Total-Count"].join() }));
