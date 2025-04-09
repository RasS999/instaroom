import { withIronSession } from "iron-session/next";

const sessionOptions = {
    password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
    cookieName: "instaroom_session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
    },
};

export function withSession(handler) {
    return withIronSession(handler, sessionOptions);
}