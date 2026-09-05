(function () {

    "use strict";


    /* =====================================================
       CONFIG
       ===================================================== */

    const DEFAULT_AD_ENABLED = false;


    /* =====================================================
       HELPERS
       ===================================================== */

    function isValidAffiliateUrl(url) {

        if (!url) {
            return false;
        }


        try {

            const parsed =
                new URL(url);


            return (
                parsed.protocol === "https:" ||
                parsed.protocol === "http:"
            );

        } catch (error) {

            return false;
        }
    }


    /* =====================================================
       AFFILIATE CTA
       ===================================================== */

    function renderAffiliate(container, affiliate) {

        if (!container) {
            return;
        }


        if (!affiliate) {
            return;
        }


        if (!affiliate.enabled) {
            return;
        }


        if (!isValidAffiliateUrl(affiliate.url)) {
            return;
        }


        container.innerHTML = "";


        const card =
            document.createElement("div");

        card.className =
            "affiliate-card";


        const icon =
            document.createElement("div");

        icon.className =
            "affiliate-icon";

        icon.textContent = "🛍️";


        const content =
            document.createElement("div");

        content.className =
            "affiliate-content";


        const title =
            document.createElement("div");

        title.className =
            "affiliate-title";

        title.textContent =
            "Ủng hộ chúng mình";


        const description =
            document.createElement("div");

        description.className =
            "affiliate-description";

        description.textContent =
            "Nếu bạn có nhu cầu mua sắm, bạn có thể tham khảo sản phẩm qua link bên dưới để ủng hộ chúng mình duy trì trang nhé.";


        const link =
            document.createElement("a");

        link.className =
            "affiliate-button";

        link.textContent =
            "🛒 Xem sản phẩm trên Shopee";

        link.href =
            affiliate.url;

        link.target =
            "_blank";

        link.rel =
            "nofollow sponsored noopener";


        content.appendChild(title);

        content.appendChild(description);

        content.appendChild(link);


        card.appendChild(icon);

        card.appendChild(content);


        container.appendChild(card);
    }


    /* =====================================================
       AD SLOT
       ===================================================== */

    function renderAd(container, position, ads) {

        if (!container) {
            return;
        }


        if (!ads || !ads.enabled) {
            return;
        }


        container.innerHTML = "";


        const ad =
            document.createElement("div");

        ad.className =
            "ad-slot";

        ad.dataset.adPosition =
            position;


        const label =
            document.createElement("span");

        label.className =
            "ad-label";

        label.textContent =
            "Quảng cáo";


        const placeholder =
            document.createElement("div");

        placeholder.className =
            "ad-placeholder";


        ad.appendChild(label);

        ad.appendChild(placeholder);

        container.appendChild(ad);
    }


    /* =====================================================
       RENDER MONETIZATION
       ===================================================== */

    function render(monetization = {}) {

        const top =
            document.getElementById(
                "monetizationTop"
            );


        const bottom =
            document.getElementById(
                "monetizationBottom"
            );


        if (!top || !bottom) {
            return;
        }


        top.innerHTML = "";

        bottom.innerHTML = "";


        const affiliate =
            monetization.affiliate || null;


        const ads =
            monetization.ads || {
                enabled: DEFAULT_AD_ENABLED
            };


        const hasAffiliate =
            affiliate &&
            affiliate.enabled &&
            isValidAffiliateUrl(
                affiliate.url
            );


        /* =================================================
           TOP
           ================================================= */

        if (hasAffiliate) {

            renderAffiliate(
                top,
                affiliate
            );

        } else {

            renderAd(
                top,
                "top",
                ads
            );
        }


        /* =================================================
           BOTTOM
           ================================================= */

        if (hasAffiliate) {

            renderAffiliate(
                bottom,
                affiliate
            );

        } else {

            renderAd(
                bottom,
                "bottom",
                ads
            );
        }

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.ReaderMonetization = {

        render: render,

        renderAffiliate: renderAffiliate,

        renderAd: renderAd

    };

})();