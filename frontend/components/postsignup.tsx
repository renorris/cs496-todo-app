"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/authcontext"

export default function PostSignup() {
    const router = useRouter()
    const auth = useAuth();

    useEffect(() => {
        const queryString = window.location.search;
        console.log(queryString);
        const urlParams = new URLSearchParams(queryString);

        const accessToken = urlParams.get("access_token")!;
        const refreshToken = urlParams.get("refresh_token")!;
        console.log(accessToken);
        console.log(refreshToken);

        auth.login(accessToken, refreshToken);

        router.push("/dashboard")
    }, [])

    return (
        <div></div>
    )
}
