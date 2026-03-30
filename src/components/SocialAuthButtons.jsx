import { useEffect, useRef } from "react";
import { socialLogin } from "../api/auth";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID;
const appleRedirectUri = import.meta.env.VITE_APPLE_REDIRECT_URI;

function loadScript(id, src) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.body.appendChild(script);
  });
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.25-.95 2.3-2.02 3l3.27 2.54c1.9-1.75 3-4.33 3-7.38 0-.72-.07-1.42-.2-2.02H12Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.27-2.54c-.9.6-2.06.96-3.35.96-2.58 0-4.78-1.74-5.56-4.08l-3.38 2.61C4.7 19.8 8.08 22 12 22Z"
      />
      <path
        fill="#4A90E2"
        d="M6.44 13.9c-.2-.6-.31-1.24-.31-1.9s.11-1.3.31-1.9L3.06 7.5A9.98 9.98 0 0 0 2 12c0 1.6.38 3.11 1.06 4.5l3.38-2.6Z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.98c1.47 0 2.8.5 3.84 1.47l2.88-2.88C16.95 2.92 14.7 2 12 2 8.08 2 4.7 4.2 3.06 7.5l3.38 2.6c.78-2.34 2.98-4.12 5.56-4.12Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.42 22v-8.2h2.76l.41-3.2h-3.17V8.56c0-.93.26-1.56 1.6-1.56h1.7V4.14c-.3-.04-1.3-.14-2.47-.14-2.45 0-4.12 1.5-4.12 4.25v2.35H7.36v3.2h2.77V22h3.29Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.68 12.64c.02 2.1 1.85 2.8 1.87 2.81-.01.05-.29 1-.95 1.98-.57.84-1.16 1.67-2.1 1.69-.92.02-1.21-.54-2.26-.54-1.05 0-1.37.52-2.23.56-.9.03-1.58-.9-2.15-1.73-1.17-1.7-2.06-4.79-.86-6.87.6-1.03 1.68-1.68 2.86-1.7.89-.02 1.73.6 2.26.6.53 0 1.53-.74 2.58-.63.44.02 1.68.18 2.47 1.34-.06.04-1.48.86-1.47 2.49Zm-2.33-6.16c.48-.58.8-1.38.71-2.18-.69.03-1.52.46-2.01 1.04-.44.5-.83 1.32-.73 2.1.77.06 1.55-.39 2.03-.96Z"
      />
    </svg>
  );
}

function SocialAuthButtons({ onSuccess, portal = "customer" }) {
  const googleRef = useRef(null);
  const { t } = useLanguage();
  const { notify } = useNotifications();

  useEffect(() => {
    if (!googleClientId || !googleRef.current) {
      return;
    }

    let mounted = true;

    loadScript("google-gsi-script", "https://accounts.google.com/gsi/client")
      .then(() => {
        if (!mounted || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              const session = await socialLogin({
                provider: "google",
                token: response.credential,
              }, portal);
              onSuccess(session);
            } catch (error) {
              notify({ type: "error", message: error.message || t("googleLoginFailed") });
            }
          },
        });

        googleRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleRef.current, {
          theme: "outline",
          size: "medium",
          shape: "rectangular",
          width: 252,
        });
      })
      .catch((error) => notify({ type: "error", message: error.message }));

    return () => {
      mounted = false;
    };
  }, [notify, onSuccess, portal]);

  const handleGoogleLogin = async () => {
    try {
      if (!googleClientId) {
        throw new Error(t("googleClientIdMissing"));
      }

      await loadScript("google-gsi-script", "https://accounts.google.com/gsi/client");

      if (!window.google?.accounts?.id) {
        throw new Error(t("googleSigninLoadError"));
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            const session = await socialLogin({
              provider: "google",
              token: response.credential,
            }, portal);
            onSuccess(session);
          } catch (error) {
            notify({ type: "error", message: error.message || t("googleLoginFailed") });
          }
        },
      });

      window.google.accounts.id.prompt();
    } catch (error) {
      notify({ type: "error", message: error.message || t("googleLoginFailed") });
    }
  };

  const handleFacebookLogin = async () => {
    try {
      if (!facebookAppId) {
        throw new Error(t("facebookAppIdMissing"));
      }

      await loadScript("facebook-sdk", "https://connect.facebook.net/en_US/sdk.js");

      await new Promise((resolve) => {
        if (window.FB) {
          resolve();
          return;
        }

        window.fbAsyncInit = () => resolve();
      });

      window.FB.init({
        appId: facebookAppId,
        cookie: true,
        xfbml: false,
        version: "v21.0",
      });

      window.FB.login(async (response) => {
        if (!response.authResponse?.accessToken) {
          notify({ type: "error", message: t("facebookLoginCancelled") });
          return;
        }

        try {
          const session = await socialLogin({
            provider: "facebook",
            token: response.authResponse.accessToken,
          }, portal);
          onSuccess(session);
        } catch (error) {
          notify({ type: "error", message: error.message || t("facebookLoginFailed") });
        }
      }, { scope: "public_profile,email" });
    } catch (error) {
      notify({ type: "error", message: error.message || t("facebookLoginFailed") });
    }
  };

  const handleAppleLogin = async () => {
    try {
      if (!appleClientId || !appleRedirectUri) {
        throw new Error(t("appleSigninConfigMissing"));
      }

      await loadScript(
        "apple-id-sdk",
        "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js",
      );

      if (!window.AppleID?.auth) {
        throw new Error(t("appleSigninLoadError"));
      }

      window.AppleID.auth.init({
        clientId: appleClientId,
        scope: "name email",
        redirectURI: appleRedirectUri,
        usePopup: true,
      });

      const response = await window.AppleID.auth.signIn();
      const session = await socialLogin({
        provider: "apple",
        token: response.authorization?.id_token,
        profile: response.user
          ? {
              email: response.user.email,
              firstName: response.user.name?.firstName,
              lastName: response.user.name?.lastName,
            }
          : undefined,
      }, portal);
      onSuccess(session);
    } catch (error) {
      notify({ type: "error", message: error.message || t("appleLoginFailed") });
    }
  };

  return (
    <div className="social-auth">
      <div className="social-auth__divider">
        <span>{t("socialContinueWith")}</span>
      </div>
      <div className="social-auth__stack">
        <div ref={googleRef} className="social-auth__google" />
        <button type="button" className="social-auth__button social-auth__button--google" onClick={handleGoogleLogin}>
          <span className="social-auth__icon"><GoogleIcon /></span>
          <span>{t("continueWithGoogle")}</span>
        </button>
        <button type="button" className="social-auth__button social-auth__button--facebook" onClick={handleFacebookLogin}>
          <span className="social-auth__icon"><FacebookIcon /></span>
          <span>{t("continueWithFacebook")}</span>
        </button>
        <button type="button" className="social-auth__button social-auth__button--apple" onClick={handleAppleLogin}>
          <span className="social-auth__icon"><AppleIcon /></span>
          <span>{t("continueWithApple")}</span>
        </button>
      </div>
    </div>
  );
}

export { SocialAuthButtons };
