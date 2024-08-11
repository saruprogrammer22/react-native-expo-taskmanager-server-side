import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import connection from "./config/db";
import userRoute from './routes/userRoute'
import taskRoute from './routes/taskRoute'
const port = process.env.PORT

const app = express()

// database
connection



app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.use("/api/my/user", userRoute)
app.use("/api/my/task", taskRoute)

app.get("/health", async (_req: Request, res: Response) => res.send({ message: "health OK!" }));


app.listen(port, () => {
    console.log(`SERVER RUNNING ON ${port}`)
})