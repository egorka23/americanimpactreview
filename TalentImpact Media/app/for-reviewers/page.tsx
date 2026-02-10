"use client";

import { useState } from "react";
import { createReviewerInquiry } from "@/lib/firestore";

export default function ForReviewersPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    field: "",
    availability: "",
    about: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">About</div>
          <h1>For Reviewers</h1>
          <p>Reviewer standards, ethical responsibilities, and evaluation criteria.</p>
          <div className="page-meta">
            <span>Confidentiality</span>
            <span>Integrity</span>
            <span>Quality</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <p>
          American Impact Review uses a structured peer review process to ensure
          academic rigor, clarity, and ethical integrity.
        </p>
        <p>
          Reviewers are selected based on subject‑matter expertise and are expected
          to provide objective feedback that improves scientific quality and
          transparency.
        </p>

        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">7–14d</div>
            <div className="lbl">Review Window</div>
          </div>
          <div className="page-vital-card">
            <div className="val">Single</div>
            <div className="lbl">Blind Review</div>
          </div>
          <div className="page-vital-card">
            <div className="val">Ethics</div>
            <div className="lbl">Required</div>
          </div>
        </div>

        <div className="card settings-card">
          <h3>Reviewer responsibilities</h3>
          <ul className="category-list">
            <li>Provide objective, constructive feedback</li>
            <li>Maintain confidentiality of submissions</li>
            <li>Declare conflicts of interest</li>
            <li>Return reviews within requested timelines</li>
            <li>Recommend acceptance, revision, or rejection</li>
          </ul>
        </div>

        <div className="card settings-card">
          <h3>Review criteria</h3>
          <ul className="category-list">
            <li>Novelty and significance</li>
            <li>Methodological rigor</li>
            <li>Clarity of presentation</li>
            <li>Ethical compliance</li>
          </ul>
        </div>

        <div className="card settings-card reviewer-form">
          <h3>Contact the editorial team</h3>
          <p>Tell us about your expertise and availability to review.</p>
          {submitted ? (
            <div className="reviewer-form__success">
              Thanks! Your reviewer profile has been submitted.
            </div>
          ) : null}
          {error ? <div className="reviewer-form__error">{error}</div> : null}
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              if (!formState.name || !formState.email || !formState.field || !formState.availability || !formState.about) {
                setError("Please complete all fields.");
                return;
              }
              setSubmitting(true);
              try {
                await createReviewerInquiry({
                  name: formState.name.trim(),
                  email: formState.email.trim(),
                  field: formState.field.trim(),
                  availability: formState.availability.trim(),
                  about: formState.about.trim()
                });
                setSubmitted(true);
                setFormState({ name: "", email: "", field: "", availability: "", about: "" });
              } catch (err) {
                setError("Submission failed. Please try again.");
              } finally {
                setSubmitting(false);
              }
            }}
            className="reviewer-form__grid"
          >
            <label>
              Full name
              <input
                className="input"
                value={formState.name}
                onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                placeholder="Dr. Avery Martinez"
              />
            </label>
            <label>
              Email
              <input
                className="input"
                type="email"
                value={formState.email}
                onChange={(event) => setFormState({ ...formState, email: event.target.value })}
                placeholder="name@university.edu"
              />
            </label>
            <label>
              Field of expertise
              <input
                className="input"
                value={formState.field}
                onChange={(event) => setFormState({ ...formState, field: event.target.value })}
                placeholder="Machine learning, public health, energy systems"
              />
            </label>
            <label>
              Availability
              <input
                className="input"
                value={formState.availability}
                onChange={(event) => setFormState({ ...formState, availability: event.target.value })}
                placeholder="2 reviews / month"
              />
            </label>
            <label className="reviewer-form__full">
              About me (short)
              <textarea
                className="input"
                rows={4}
                value={formState.about}
                onChange={(event) => setFormState({ ...formState, about: event.target.value })}
                placeholder="Short bio, research interests, recent publications"
              />
            </label>
            <div className="reviewer-form__actions">
              <button type="submit" className="button" disabled={submitting}>
                {submitting ? "Submitting..." : "Send inquiry"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
