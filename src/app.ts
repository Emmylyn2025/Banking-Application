import express from "express";
import { globalError, appError } from "./utils/error";
import cookieParser from "cookie-parser";
import router from "./routes/router";
import limiter from "./rateLimit/limiter";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.set('query parser', 'extended');

app.use(limiter);
app.use('/banking', router);

//Not found error handler
app.use((req, res, next) => {
  next(new appError(`The request ${req.originalUrl} with method ${req.method} is not found on the server`, 404));
});

//Global Error handler
app.use(globalError);

export default app;