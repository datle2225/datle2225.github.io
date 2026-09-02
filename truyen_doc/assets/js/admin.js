(function (window, $) {

    "use strict";


    // ==========================================
    // CONFIG
    // ==========================================

    const CONFIG =
        window.TRUYEN_DOC_CONFIG;


    const ADMIN_KEY =
        "truyen_doc_admin_logged_in";


    let editor = null;

    let currentChapters = [];



    // ==========================================
    // TOAST
    // ==========================================

    function showToast(
        message,
        type = "success"
    ) {

        const toast =
            $("#toast");


        toast
            .removeClass(
                "show success error"
            )
            .addClass(type)
            .text(message);


        setTimeout(() => {

            toast.addClass("show");

        }, 10);


        setTimeout(() => {

            toast.removeClass("show");

        }, 3000);

    }



    // ==========================================
    // ADMIN LOGIN
    // ==========================================

    function isLoggedIn() {

        return (
            sessionStorage.getItem(
                ADMIN_KEY
            ) === "true"
        );

    }


    function showAdmin() {

        $("#login-screen")
            .addClass("hidden");

        $("#admin-app")
            .removeClass("hidden");

    }


    function showLogin() {

        $("#login-screen")
            .removeClass("hidden");

        $("#admin-app")
            .addClass("hidden");

    }


    $("#btn-login").on(
        "click",
        function () {

            const password =
                $("#admin-password")
                    .val();


            /*
             * MẬT KHẨU DEMO
             *
             * Hãy đổi trước khi public.
             */

            const ADMIN_PASSWORD =
                "admin123";


            if (
                password ===
                ADMIN_PASSWORD
            ) {

                sessionStorage.setItem(
                    ADMIN_KEY,
                    "true"
                );

                $("#login-error")
                    .text("");

                showAdmin();

                initEditor();

            } else {

                $("#login-error")
                    .text(
                        "Sai mật khẩu."
                    );

            }

        }
    );


    $("#admin-password").on(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                $("#btn-login").click();

            }

        }
    );


    $("#btn-logout").on(
        "click",
        function () {

            sessionStorage.removeItem(
                ADMIN_KEY
            );

            GitHubAPI.clearToken();

            location.reload();

        }
    );



    // ==========================================
    // GITHUB UI
    // ==========================================

    function initGitHubUI() {

        const github =
            CONFIG.github;


        $("#github-repository")
            .text(
                github.owner +
                "/" +
                github.repo
            );


        $("#github-branch")
            .text(
                github.branch
            );


        updateGitHubStatus();

    }


    function updateGitHubStatus() {

        if (
            GitHubAPI.isConnected()
        ) {

            $("#github-status")
                .text(
                    "● Đã kết nối"
                )
                .removeClass(
                    "disconnected"
                )
                .addClass(
                    "connected"
                );

        } else {

            $("#github-status")
                .text(
                    "● Chưa kết nối"
                )
                .removeClass(
                    "connected"
                )
                .addClass(
                    "disconnected"
                );

        }

    }



    // ==========================================
    // CONNECT GITHUB
    // ==========================================

    $("#btn-github-connect").on(
        "click",
        async function () {

            const button = $(this);


            const token =
                $("#github-token")
                    .val()
                    .trim();


            if (!token) {

                showToast(
                    "Hãy nhập GitHub token.",
                    "error"
                );

                return;

            }


            button
                .prop(
                    "disabled",
                    true
                )
                .text(
                    "Đang kết nối..."
                );


            try {

                GitHubAPI.setToken(
                    token
                );


                const repo =
                    await GitHubAPI
                        .testConnection();


                updateGitHubStatus();


                $("#github-token")
                    .val("");


                showToast(
                    "Kết nối GitHub thành công.",
                    "success"
                );


                console.log(
                    "Connected repository:",
                    repo.full_name
                );


            } catch (error) {

                GitHubAPI.clearToken();

                updateGitHubStatus();


                showToast(
                    "Không thể kết nối GitHub: " +
                    error.message,
                    "error"
                );

            }


            button
                .prop(
                    "disabled",
                    false
                )
                .text(
                    "🔗 Kết nối GitHub"
                );

        }
    );



    // ==========================================
    // DISCONNECT
    // ==========================================

    $("#btn-github-disconnect").on(
        "click",
        function () {

            GitHubAPI.clearToken();

            updateGitHubStatus();

            showToast(
                "Đã ngắt kết nối GitHub.",
                "success"
            );

        }
    );



    // ==========================================
    // CKEDITOR
    // ==========================================

    async function initEditor(
        content = ""
    ) {

        if (editor) {

            try {

                await editor.destroy();

            } catch (error) {

                console.warn(error);

            }

            editor = null;

        }


        const {
            DecoupledEditor,
            Essentials,
            Paragraph,
            Heading,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            Link,
            BlockQuote,
            List,
            Alignment,
            Indent,
            Table,
            TableToolbar,
            HorizontalLine,
            RemoveFormat
        } = CKEDITOR;


        try {

            editor =
                await DecoupledEditor.create({

                    root: {

                        element:
                            document.querySelector(
                                "#chapter-editor"
                            )

                    },


                    /*
                     * Nếu CKEditor yêu cầu
                     * license riêng của CDN,
                     * thay GPL bằng license
                     * phù hợp.
                     */

                    licenseKey: "GPL",


                    plugins: [

                        Essentials,

                        Paragraph,

                        Heading,

                        Bold,

                        Italic,

                        Underline,

                        Strikethrough,

                        Link,

                        BlockQuote,

                        List,

                        Alignment,

                        Indent,

                        Table,

                        TableToolbar,

                        HorizontalLine,

                        RemoveFormat

                    ],


                    toolbar: [

                        "undo",

                        "redo",

                        "|",

                        "heading",

                        "|",

                        "bold",

                        "italic",

                        "underline",

                        "strikethrough",

                        "|",

                        "link",

                        "blockQuote",

                        "horizontalLine",

                        "|",

                        "bulletedList",

                        "numberedList",

                        "|",

                        "alignment",

                        "outdent",

                        "indent",

                        "|",

                        "insertTable",

                        "removeFormat"

                    ],


                    table: {

                        contentToolbar: [

                            "tableColumn",

                            "tableRow",

                            "mergeTableCells"

                        ]

                    },


                    root: {

                        element:
                            document.querySelector(
                                "#chapter-editor"
                            ),

                        placeholder:
                            "Viết nội dung chương..."

                    }

                });


            $("#editor-toolbar")
                .empty()
                .append(
                    editor.ui.view.toolbar.element
                );


            editor.setData(
                content || ""
            );


            return editor;


        } catch (error) {

            console.error(
                "CKEditor error:",
                error
            );


            showToast(
                "Không thể khởi tạo CKEditor.",
                "error"
            );

            throw error;

        }

    }



    // ==========================================
    // NOVEL DATA
    // ==========================================

    async function loadNovel(
        novelId
    ) {

        const path =
            `data/novels/${novelId}/info.json`;


        const result =
            await GitHubAPI.getJson(
                path
            );


        const novel =
            result.data;


        $("#novel-id")
            .val(
                novel.id || novelId
            );


        $("#novel-title")
            .val(
                novel.title || ""
            );


        $("#novel-author")
            .val(
                novel.author || ""
            );


        $("#novel-description")
            .val(
                novel.description || ""
            );


        $("#novel-cover")
            .val(
                novel.cover || ""
            );


        $("#novel-status")
            .val(
                novel.status ||
                "Đang ra"
            );


        $("#chapter-novel-id")
            .val(
                novel.id || novelId
            );


        await loadChapters(
            novelId
        );

    }



    // ==========================================
    // SAVE NOVEL
    // ==========================================

    $("#btn-save-novel").on(
        "click",
        async function () {

            try {

                if (
                    !GitHubAPI.isConnected()
                ) {

                    throw new Error(
                        "Chưa kết nối GitHub."
                    );

                }


                const id =
                    $("#novel-id")
                        .val()
                        .trim();


                const title =
                    $("#novel-title")
                        .val()
                        .trim();


                if (!id) {

                    throw new Error(
                        "Novel ID không được để trống."
                    );

                }


                if (!title) {

                    throw new Error(
                        "Tên truyện không được để trống."
                    );

                }


                const button =
                    $(this);


                button
                    .prop(
                        "disabled",
                        true
                    )
                    .text(
                        "Đang lưu..."
                    );


                const path =
                    `data/novels/${id}/info.json`;


                let sha = null;


                try {

                    const old =
                        await GitHubAPI
                            .getFile(path);

                    sha = old.sha;

                } catch (error) {

                    if (
                        error.status !== 404
                    ) {

                        throw error;

                    }

                }


                const novel = {

                    id,

                    title,

                    author:
                        $("#novel-author")
                            .val()
                            .trim(),

                    description:
                        $("#novel-description")
                            .val()
                            .trim(),

                    cover:
                        $("#novel-cover")
                            .val()
                            .trim(),

                    status:
                        $("#novel-status")
                            .val(),

                    updatedAt:
                        new Date()
                            .toISOString()
                            .slice(
                                0,
                                10
                            )

                };


                await GitHubAPI.saveJson(

                    path,

                    novel,

                    `Update novel ${id}`,

                    sha

                );


                await updateNovelCatalog(
                    novel
                );


                $("#chapter-novel-id")
                    .val(id);


                showToast(
                    "Đã lưu thông tin truyện.",
                    "success"
                );


            } catch (error) {

                console.error(error);


                showToast(
                    error.message,
                    "error"
                );

            }


            $(this)
                .prop(
                    "disabled",
                    false
                )
                .text(
                    "💾 Lưu thông tin truyện"
                );

        }
    );



    // ==========================================
    // NOVELS.JSON
    // ==========================================

    async function updateNovelCatalog(
        novel
    ) {

        const path =
            "data/novels.json";


        let novels = [];

        let sha = null;


        try {

            const result =
                await GitHubAPI
                    .getJson(path);

            novels =
                Array.isArray(
                    result.data
                )
                    ? result.data
                    : [];

            sha =
                result.sha;


        } catch (error) {

            if (
                error.status !== 404
            ) {

                throw error;

            }

        }


        const catalogItem = {

            id: novel.id,

            title: novel.title,

            author: novel.author,

            description:
                novel.description,

            cover: novel.cover,

            status: novel.status,

            updatedAt:
                novel.updatedAt

        };


        const index =
            novels.findIndex(
                item =>
                    item.id === novel.id
            );


        if (index >= 0) {

            novels[index] =
                catalogItem;

        } else {

            novels.push(
                catalogItem
            );

        }


        novels.sort(
            (a, b) =>
                a.title.localeCompare(
                    b.title,
                    "vi"
                )
        );


        await GitHubAPI.saveJson(

            path,

            novels,

            `Update novel catalog ${novel.id}`,

            sha

        );

    }



    // ==========================================
    // LOAD CHAPTERS
    // ==========================================

    async function loadChapters(
        novelId
    ) {

        try {

            const path =
                `data/novels/${novelId}/chapters.json`;


            const result =
                await GitHubAPI.getJson(
                    path
                );


            currentChapters =
                Array.isArray(
                    result.data
                )
                    ? result.data
                    : [];


            renderChapterList(
                novelId
            );


        } catch (error) {

            if (
                error.status === 404
            ) {

                currentChapters = [];

                renderChapterList(
                    novelId
                );

                return;

            }


            showToast(
                error.message,
                "error"
            );

        }

    }



    // ==========================================
    // RENDER CHAPTER LIST
    // ==========================================

    function renderChapterList(
        novelId
    ) {

        const container =
            $("#chapter-list");


        container.empty();


        if (
            currentChapters.length === 0
        ) {

            container.html(
                `<div class="empty-state">
                    Chưa có chương nào.
                </div>`
            );

            return;

        }


        currentChapters
            .forEach(
                chapter => {

                    const item = $(`
                        <div class="chapter-item">

                            <div class="chapter-id">
                                #${escapeHtml(
                                    chapter.id
                                )}
                            </div>

                            <div class="chapter-name">
                                ${escapeHtml(
                                    chapter.title
                                )}
                            </div>

                            <div class="chapter-actions">

                                <button
                                    class="btn btn-sm btn-primary btn-open-chapter"
                                    data-id="${escapeAttr(
                                        chapter.id
                                    )}"
                                >
                                    Mở
                                </button>

                            </div>

                        </div>
                    `);


                    container.append(
                        item
                    );

                }
            );

    }



    // ==========================================
    // OPEN CHAPTER
    // ==========================================

    $(document).on(
        "click",
        ".btn-open-chapter",
        async function () {

            const chapterId =
                $(this)
                    .data("id");


            const novelId =
                $("#chapter-novel-id")
                    .val()
                    .trim();


            await loadChapter(
                novelId,
                chapterId
            );

        }
    );



    // ==========================================
    // LOAD CHAPTER
    // ==========================================

    async function loadChapter(
        novelId,
        chapterId
    ) {

        try {

            const path =
                `data/novels/${novelId}/${chapterId}.json`;


            const result =
                await GitHubAPI.getJson(
                    path
                );


            const chapter =
                result.data;


            $("#chapter-novel-id")
                .val(novelId);


            $("#chapter-id")
                .val(
                    chapter.id ||
                    chapterId
                );


            $("#chapter-title")
                .val(
                    chapter.title ||
                    ""
                );


            await initEditor(
                chapter.content || ""
            );


            $("#editor-status")
                .removeClass(
                    "error"
                )
                .addClass(
                    "success"
                )
                .text(
                    "Đã tải chương từ GitHub."
                );


            window.scrollTo({
                top:
                    $("#chapter-editor")
                        .offset()
                        .top - 100,
                behavior:
                    "smooth"
            });


        } catch (error) {

            showToast(
                "Không thể mở chương: " +
                error.message,
                "error"
            );

        }

    }



    // ==========================================
    // SAVE CHAPTER
    // ==========================================

    $("#btn-save-chapter").on(
        "click",
        async function () {

            const button =
                $(this);


            try {

                if (
                    !GitHubAPI.isConnected()
                ) {

                    throw new Error(
                        "Chưa kết nối GitHub."
                    );

                }


                if (!editor) {

                    throw new Error(
                        "CKEditor chưa sẵn sàng."
                    );

                }


                const novelId =
                    $("#chapter-novel-id")
                        .val()
                        .trim();


                const chapterId =
                    $("#chapter-id")
                        .val()
                        .trim();


                const chapterTitle =
                    $("#chapter-title")
                        .val()
                        .trim();


                if (!novelId) {

                    throw new Error(
                        "Chưa nhập Novel ID."
                    );

                }


                if (!chapterId) {

                    throw new Error(
                        "Chưa nhập Chapter ID."
                    );

                }


                if (!chapterTitle) {

                    throw new Error(
                        "Chưa nhập tên chương."
                    );

                }


                const content =
                    editor.getData();


                button
                    .prop(
                        "disabled",
                        true
                    )
                    .text(
                        "⏳ Đang lưu..."
                    );


                // --------------------------------
                // SAVE CHAPTER JSON
                // --------------------------------

                const chapterPath =
                    `data/novels/${novelId}/${chapterId}.json`;


                let chapterSha = null;


                try {

                    const existing =
                        await GitHubAPI
                            .getFile(
                                chapterPath
                            );

                    chapterSha =
                        existing.sha;

                } catch (error) {

                    if (
                        error.status !== 404
                    ) {

                        throw error;

                    }

                }


                const chapter = {

                    id:
                        chapterId,

                    title:
                        chapterTitle,

                    content:
                        content

                };


                await GitHubAPI.saveJson(

                    chapterPath,

                    chapter,

                    `Update chapter ${novelId}/${chapterId}`,

                    chapterSha

                );


                // --------------------------------
                // UPDATE CHAPTER INDEX
                // --------------------------------

                await updateChapterIndex(

                    novelId,

                    chapterId,

                    chapterTitle

                );


                showToast(
                    "Đã lưu chương lên GitHub.",
                    "success"
                );


                $("#editor-status")
                    .removeClass("error")
                    .addClass("success")
                    .text(
                        "✓ Đã lưu thành công."
                    );


                await loadChapters(
                    novelId
                );


            } catch (error) {

                console.error(
                    error
                );


                $("#editor-status")
                    .removeClass("success")
                    .addClass("error")
                    .text(
                        error.message
                    );


                showToast(
                    error.message,
                    "error"
                );

            }


            button
                .prop(
                    "disabled",
                    false
                )
                .text(
                    "💾 Lưu chương lên GitHub"
                );

        }
    );



    // ==========================================
    // UPDATE CHAPTER INDEX
    // ==========================================

    async function updateChapterIndex(

        novelId,

        chapterId,

        chapterTitle

    ) {

        const path =
            `data/novels/${novelId}/chapters.json`;


        let chapters = [];

        let sha = null;


        try {

            const result =
                await GitHubAPI.getJson(
                    path
                );


            chapters =
                Array.isArray(
                    result.data
                )
                    ? result.data
                    : [];


            sha =
                result.sha;


        } catch (error) {

            if (
                error.status !== 404
            ) {

                throw error;

            }

        }


        const chapter = {

            id:
                chapterId,

            title:
                chapterTitle

        };


        const index =
            chapters.findIndex(
                item =>
                    item.id === chapterId
            );


        if (index >= 0) {

            chapters[index] =
                chapter;

        } else {

            chapters.push(
                chapter
            );

        }


        chapters.sort(
            (a, b) =>
                numericChapterId(
                    a.id
                ) -
                numericChapterId(
                    b.id
                )
        );


        await GitHubAPI.saveJson(

            path,

            chapters,

            `Update chapters index ${novelId}`,

            sha

        );


        currentChapters =
            chapters;


        renderChapterList(
            novelId
        );

    }



    // ==========================================
    // LOAD CHAPTER BUTTON
    // ==========================================

    $("#btn-load-chapter").on(
        "click",
        async function () {

            const novelId =
                $("#chapter-novel-id")
                    .val()
                    .trim();


            const chapterId =
                $("#chapter-id")
                    .val()
                    .trim();


            if (!novelId ||
                !chapterId) {

                showToast(
                    "Nhập Novel ID và Chapter ID.",
                    "error"
                );

                return;

            }


            await loadChapter(
                novelId,
                chapterId
            );

        }
    );



    // ==========================================
    // INIT
    // ==========================================

    async function initialize() {

        initGitHubUI();


        if (!isLoggedIn()) {

            showLogin();

            return;

        }


        showAdmin();


        try {

            await initEditor();

        } catch (error) {

            console.error(error);

        }

    }



    // ==========================================
    // HELPERS
    // ==========================================

    function numericChapterId(
        id
    ) {

        const number =
            parseInt(
                String(id)
                    .replace(/\D/g, ""),
                10
            );


        return Number.isNaN(number)
            ? 0
            : number;

    }


    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    function escapeAttr(
        value
    ) {

        return escapeHtml(
            value
        );

    }


    // ==========================================
    // START
    // ==========================================

    $(document).ready(
        function () {

            initialize();

        }
    );


})(window, jQuery);