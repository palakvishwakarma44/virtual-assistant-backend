import jwt from "jsonwebtoken"
const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token
        if (!token) {
            console.log("Auth token missing in cookies");
            return res.status(401).json({ message: "token not found" }) // changed 400 to 401
        }
        const verifyToken = await jwt.verify(token, process.env.JWT_SECRET)
        req.userId = verifyToken.userId

        next()

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "is Auth error" })
    }
}

export default isAuth