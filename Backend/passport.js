const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const prisma = require("./lib/prisma");

const googleReady = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const uniqueUsername = async (base) => {
  const cleaned = (base || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16) || "user";
  let username = cleaned;
  let i = 0;
  while (await prisma.user.findUnique({ where: { username } })) {
    i += 1;
    username = `${cleaned}${i}`;
  }
  return username;
};

if (googleReady()) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || "http://localhost:3001"}/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(null, false);

          let user = await prisma.user.findFirst({
            where: {
              OR: [{ googleId: profile.id }, { email }],
            },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                googleId: profile.id,
                username: await uniqueUsername(
                  profile.displayName || email.split("@")[0]
                ),
                avatar: profile.photos?.[0]?.value,
              },
            });
          } else if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id, avatar: user.avatar || profile.photos?.[0]?.value },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

module.exports = { passport, googleReady };
