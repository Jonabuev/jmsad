import React from "react";

import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import Forum from "@/component/screens/forum/Forum";

const ForumPage: React.FC = () => {
  return <Forum />;
};

export default ForumPage;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common", "forum"])),
    },
  };
};
