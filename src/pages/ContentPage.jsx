import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPage } from "../api/content";
import { LoadingState } from "../components/LoadingState";
import { useLanguage } from "../context/LanguageContext";
import { translateContentPage, translateTextsCached } from "../lib/contentTranslation";

const aboutEnglish = {
  eyebrow: "Our Story",
  title: "About Nature Republic",
  intro:
    "Established on 17 February 2009, Nature Republic is a skincare brand dedicated to making quality, nature-inspired skincare products accessible to customers across the UAE and Gulf region.",
  blocks: [
    {
      heading: "Natural Skincare for Every Skin",
      paragraphs: [
        "We offer a wide range of skincare products in Dubai and across the UAE, carefully selected for customers looking for effective and nature-focused solutions for their daily skincare needs. Our collection includes products designed to support different skin types and skincare routines.",
      ],
    },
    {
      heading: "Skincare Designed for the Gulf",
      paragraphs: [
        "We understand that the climate and lifestyle in the Gulf can create unique skincare needs. That is why Nature Republic focuses on providing skincare products suitable for customers in the UAE and Gulf region.",
        "Whether you are looking for everyday skincare essentials or products to build a complete skincare routine, our goal is to make it easier for you to find the products you need in one place.",
      ],
    },
    {
      heading: "Our Mission",
      paragraphs: [
        "Our mission is simple: to make a wide range of skincare products easily available to customers across the UAE.",
        "From our location in Dubai Mall, we aim to provide customers with access to quality skincare products while delivering a convenient and reliable shopping experience.",
      ],
    },
    {
      heading: "Why Nature Republic?",
      paragraphs: [],
      highlights: [
        "Established on 17 February 2009",
        "Wide range of skincare products",
        "Nature-inspired skincare solutions",
        "Products selected with Gulf customers in mind",
        "Convenient shopping in Dubai and across the UAE",
        "A growing selection of skincare products for different needs and routines",
      ],
    },
  ],
  commitmentHeading: "Our Commitment",
  commitmentParagraphs: [
    "At Nature Republic, we believe skincare should be simple, accessible and inspired by nature.",
    "Discover Nature Republic and find skincare products for your everyday routine.",
  ],
};

// Every visible string is sent through the shared client-side translator in a
// single batch, so switching the language swaps the whole About page at once.
function flattenAbout(copy) {
  const texts = [copy.eyebrow, copy.title, copy.intro];
  copy.blocks.forEach((block) => {
    texts.push(block.heading);
    texts.push(...block.paragraphs);
    if (block.highlights) texts.push(...block.highlights);
  });
  texts.push(copy.commitmentHeading, ...copy.commitmentParagraphs);
  return texts;
}

function applyAboutTranslation(copy, translated) {
  let cursor = 0;
  const take = () => translated[cursor++] ?? "";

  return {
    eyebrow: take(),
    title: take(),
    intro: take(),
    blocks: copy.blocks.map((block) => ({
      heading: take(),
      paragraphs: block.paragraphs.map(() => take()),
      highlights: block.highlights ? block.highlights.map(() => take()) : undefined,
    })),
    commitmentHeading: take(),
    commitmentParagraphs: copy.commitmentParagraphs.map(() => take()),
  };
}

function AboutContent({ copy }) {
  return (
    <article className="about-page">
      <header className="about-hero">
        <span className="section-eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>

      {copy.blocks.map((block) => (
        <section className="about-section" key={block.heading}>
          <h2>{block.heading}</h2>
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {block.highlights ? (
            <ul className="about-highlights">
              {block.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <section className="about-commitment">
        <h2>{copy.commitmentHeading}</h2>
        {copy.commitmentParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
    </article>
  );
}

function ContentPage() {
  const { t, language } = useLanguage();
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [aboutCopy, setAboutCopy] = useState(aboutEnglish);

  useEffect(() => {
    let isCancelled = false;
    setPage(null);
    setStatus("loading");

    if (slug === "about") {
      setStatus("ready");

      if (language === "en") {
        setAboutCopy(aboutEnglish);
        return () => {
          isCancelled = true;
        };
      }

      translateTextsCached(language, flattenAbout(aboutEnglish))
        .then((texts) => {
          if (isCancelled) return;
          setAboutCopy(applyAboutTranslation(aboutEnglish, texts));
        })
        .catch(() => {});

      return () => {
        isCancelled = true;
      };
    }

    getPage(slug)
      .then(async (item) => {
        if (isCancelled) return;
        setPage(await translateContentPage(language, item));
        setStatus("ready");
      })
      .catch(() => {
        if (isCancelled) return;
        setPage(null);
        setStatus("error");
      });

    return () => {
      isCancelled = true;
    };
  }, [slug, language]);

  if (slug === "about") {
    return <AboutContent copy={aboutCopy} />;
  }

  if (status === "loading") {
    return <LoadingState label={t("loadingGeneric")} />;
  }

  if (!page) {
    return <section className="empty-panel">{t("pageNotFound")}</section>;
  }

  return (
    <article className={`content-page ${slug === "contact" ? "content-page--contact" : "content-page--article"}`}>
      <span className="section-eyebrow">{t("information")}</span>
      <h1>{page.title}</h1>
      <p>{page.content}</p>
      {slug === "contact" ? (
        <div className="content-contact-grid">
          <div className="content-contact-card">
            <strong>Email Support</strong>
            <p>support@naturerepublic.com</p>
          </div>
          <div className="content-contact-card">
            <strong>Customer Care</strong>
            <p>+971 50 000 0000</p>
          </div>
          <div className="content-contact-card">
            <strong>Working Hours</strong>
            <p>Monday to Saturday, 9 AM to 6 PM</p>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export { ContentPage };
