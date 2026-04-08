import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { sendChatbotMessage } from "../api/chatbot";
import { mediaUrl } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { Icon } from "./Icon";

const starterSuggestions = [
  "Show best sellers",
  "Show featured products",
  "Skincare products",
  "Return policy",
];

function buildWelcomeMessage(t) {
  return {
    id: "welcome",
    role: "bot",
    text: t("chatbotWelcomeCopy"),
    suggestions: starterSuggestions.map((item, index) => ({
      id: `starter-${index}`,
      label: item,
    })),
    products: [],
    categories: [],
  };
}

function ChatbotWidget() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(() => [buildWelcomeMessage(t)]);
  const inputRef = useRef(null);

  const suggestions = useMemo(() => starterSuggestions.map((label, index) => ({ id: `chip-${index}`, label })), []);

  const appendMessage = (message) => {
    setMessages((current) => [...current, message]);
  };

  const handleOpen = () => {
    setIsOpen((current) => !current);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSend = async (nextMessage) => {
    const message = (nextMessage ?? input).trim();
    if (!message || isSending) return;

    appendMessage({
      id: `user-${Date.now()}`,
      role: "user",
      text: message,
      products: [],
      categories: [],
      suggestions: [],
    });
    setInput("");
    setIsSending(true);

    try {
      const response = await sendChatbotMessage(message);
      appendMessage({
        id: `bot-${Date.now()}`,
        role: "bot",
        text: response.reply,
        products: response.products || [],
        categories: response.categories || [],
        suggestions: (response.suggestions || []).map((label, index) => ({ id: `${Date.now()}-${index}`, label })),
      });
    } catch (error) {
      appendMessage({
        id: `bot-error-${Date.now()}`,
        role: "bot",
        text: error.message || t("chatbotFallbackReply"),
        products: [],
        categories: [],
        suggestions,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`chatbot-widget ${isOpen ? "is-open" : ""}`}>
      {isOpen ? (
        <section className="chatbot-panel" aria-label={t("chatbotTitle")}>
          <div className="chatbot-panel__header">
            <div>
              <strong>{t("chatbotTitle")}</strong>
              <p>{t("chatbotSubtitle")}</p>
            </div>
            <button type="button" className="chatbot-panel__close" onClick={handleOpen} aria-label={t("close")}>
              ×
            </button>
          </div>

          <div className="chatbot-panel__messages">
            {messages.map((message) => (
              <article key={message.id} className={`chatbot-message chatbot-message--${message.role}`}>
                <div className="chatbot-bubble">
                  <p>{message.text}</p>
                  {message.categories?.length ? (
                    <div className="chatbot-message__list">
                      {message.categories.map((category) => (
                        <Link key={category._id} to={`/products?categoryId=${category._id}`} className="chatbot-mini-card">
                          {category.image ? <img src={mediaUrl(category.image)} alt={category.name} /> : <div className="chatbot-mini-card__placeholder">{category.name.slice(0, 1)}</div>}
                          <div>
                            <strong>{category.name}</strong>
                            <span>{category.description || t("categoryFallbackCopy")}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  {message.products?.length ? (
                    <div className="chatbot-message__list">
                      {message.products.map((product) => (
                        <Link key={product._id} to={`/products/${product.slug}`} className="chatbot-mini-card">
                          {product.images?.[0] ? <img src={mediaUrl(product.images[0])} alt={product.name} /> : <div className="chatbot-mini-card__placeholder">{product.name.slice(0, 1)}</div>}
                          <div>
                            <strong>{product.name}</strong>
                            <span>AED {Number(product.price || 0).toFixed(2)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : null}

                  {message.suggestions?.length ? (
                    <div className="chatbot-suggestions">
                      {message.suggestions.map((suggestion) => (
                        <button key={suggestion.id} type="button" className="chatbot-suggestion" onClick={() => handleSend(suggestion.label)}>
                          {suggestion.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}

            {isSending ? (
              <article className="chatbot-message chatbot-message--bot">
                <div className="chatbot-bubble chatbot-bubble--loading">
                  <span />
                  <span />
                  <span />
                </div>
              </article>
            ) : null}
          </div>

          <form
            className="chatbot-panel__composer"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("chatbotInputPlaceholder")}
            />
            <button type="submit" className="solid-button solid-button--with-icon" disabled={isSending}>
              <Icon name="message" className="button-icon" />
              {t("send")}
            </button>
          </form>
        </section>
      ) : null}

      <button type="button" className="chatbot-toggle" onClick={handleOpen} aria-label={t("chatbotOpen")}>
        <Icon name="message" className="chatbot-toggle__icon" />
      </button>
    </div>
  );
}

export { ChatbotWidget };
