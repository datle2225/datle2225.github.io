(function (window) {

    "use strict";

    const CONFIG = window.TRUYEN_DOC_CONFIG.github;

    const TOKEN_KEY = "truyen_doc_github_token";


    // ==========================================
    // TOKEN
    // ==========================================

    function getToken() {

        return sessionStorage.getItem(TOKEN_KEY);

    }


    function setToken(token) {

        sessionStorage.setItem(
            TOKEN_KEY,
            token
        );

    }


    function clearToken() {

        sessionStorage.removeItem(
            TOKEN_KEY
        );

    }


    function isConnected() {

        return !!getToken();

    }


    // ==========================================
    // API URL
    // ==========================================

    function apiUrl(path) {

        return (
            "https://api.github.com/repos/" +
            encodeURIComponent(CONFIG.owner) +
            "/" +
            encodeURIComponent(CONFIG.repo) +
            "/contents/" +
            path
        );

    }


    // ==========================================
    // HEADERS
    // ==========================================

    function getHeaders() {

        const token = getToken();

        const headers = {

            "Accept":
                "application/vnd.github+json",

            "X-GitHub-Api-Version":
                "2022-11-28"

        };

        if (token) {

            headers.Authorization =
                "Bearer " + token;

        }

        return headers;

    }


    // ==========================================
    // REQUEST
    // ==========================================

    async function request(
        url,
        options = {}
    ) {

        const response = await fetch(
            url,
            {
                ...options,

                headers: {
                    ...getHeaders(),
                    ...(options.headers || {})
                }
            }
        );


        let data = null;

        try {

            data = await response.json();

        } catch (error) {

            data = null;

        }


        if (!response.ok) {

            const message =
                data?.message ||
                `HTTP ${response.status}`;

            const error =
                new Error(message);

            error.status =
                response.status;

            error.github =
                data;

            throw error;

        }


        return data;

    }


    // ==========================================
    // BASE64
    // ==========================================

    function decodeBase64(base64) {

        const binary =
            atob(
                base64.replace(/\n/g, "")
            );

        const bytes =
            new Uint8Array(
                binary.length
            );


        for (
            let i = 0;
            i < binary.length;
            i++
        ) {

            bytes[i] =
                binary.charCodeAt(i);

        }


        return new TextDecoder(
            "utf-8"
        ).decode(bytes);

    }


    function encodeBase64(text) {

        const bytes =
            new TextEncoder().encode(text);

        let binary = "";

        const chunkSize = 0x8000;


        for (
            let i = 0;
            i < bytes.length;
            i += chunkSize
        ) {

            const chunk =
                bytes.subarray(
                    i,
                    Math.min(
                        i + chunkSize,
                        bytes.length
                    )
                );

            binary +=
                String.fromCharCode(
                    ...chunk
                );

        }


        return btoa(binary);

    }


    // ==========================================
    // GET FILE
    // ==========================================

    async function getFile(path) {

        const data =
            await request(
                apiUrl(path)
            );


        return {

            sha: data.sha,

            path: data.path,

            content:
                decodeBase64(
                    data.content
                )

        };

    }


    // ==========================================
    // GET JSON
    // ==========================================

    async function getJson(path) {

        const file =
            await getFile(path);


        return {

            sha: file.sha,

            data:
                JSON.parse(
                    file.content
                )

        };

    }


    // ==========================================
    // SAVE FILE
    // ==========================================

    async function saveFile(
        path,
        content,
        message,
        sha = null
    ) {

        const body = {

            message,

            content:
                encodeBase64(
                    content
                ),

            branch:
                CONFIG.branch

        };


        if (sha) {

            body.sha = sha;

        }


        return await request(
            apiUrl(path),
            {

                method: "PUT",

                body:
                    JSON.stringify(body)

            }
        );

    }


    // ==========================================
    // SAVE JSON
    // ==========================================

    async function saveJson(
        path,
        data,
        message,
        sha = null
    ) {

        const content =
            JSON.stringify(
                data,
                null,
                2
            );


        return await saveFile(
            path,
            content,
            message,
            sha
        );

    }


    // ==========================================
    // DELETE FILE
    // ==========================================

    async function deleteFile(
        path,
        sha,
        message
    ) {

        return await request(
            apiUrl(path),
            {

                method: "DELETE",

                body:
                    JSON.stringify({

                        message,

                        sha,

                        branch:
                            CONFIG.branch

                    })

            }
        );

    }


    // ==========================================
    // TEST CONNECTION
    // ==========================================

    async function testConnection() {

        const url =
            "https://api.github.com/repos/" +
            encodeURIComponent(
                CONFIG.owner
            ) +
            "/" +
            encodeURIComponent(
                CONFIG.repo
            );


        return await request(
            url
        );

    }


    // ==========================================
    // PUBLIC API
    // ==========================================

    window.GitHubAPI = {

        getToken,
        setToken,
        clearToken,
        isConnected,

        getFile,
        getJson,

        saveFile,
        saveJson,

        deleteFile,

        testConnection

    };


})(window);