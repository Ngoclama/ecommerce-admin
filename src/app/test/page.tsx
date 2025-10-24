"use server";
import { createStore } from "@/action/store";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

const page = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }
  // const res = await createStore("My Store", user.id);
  // console.log(res);
  return <div>fad</div>;
};

export default page;
