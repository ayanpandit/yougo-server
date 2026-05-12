import { env } from "@/config";

type SendMagicLinkInput = {
  email: string;
  url: string;
};

export const sendMagicLinkEmail = async ({ email, url }: SendMagicLinkInput) => {
  console.log("Magic link email", { from: env.MAGIC_LINK_FROM_EMAIL, email, url });
};
