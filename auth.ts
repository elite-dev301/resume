import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import CredentialsProvider from 'next-auth/providers/credentials';
import Member from "@/lib/models/Member";
import dbConnectMongoose from "@/lib/mongodb";

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [CredentialsProvider({
    name: 'Credentials',
    credentials: {
      userID: { label: 'UserID', type: 'text' },
      password: { label: 'Password', type: 'password' }
    },
    authorize: async (credentials, req) => {

      await dbConnectMongoose();
      const { userID, password } = credentials;
      const member = await Member.findOne({ userID: userID });

      if (member && await member.comparePassword(password as string)) {

        console.log(member);
        return { id: member.id, name: member.name, role: member.role };
      }

      return null;
    }
  })],
});