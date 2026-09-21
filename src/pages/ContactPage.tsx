import { useState, type FormEvent } from 'react';
import contactAvatar from '../assets/conatct.png';
import { saveContact } from '../services/contactService';
import { useActionLock } from '../hooks/useActionLock';

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const empty: FormState = { name: '', email: '', subject: '', message: '' };

export function ContactPage() {
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [done, setDone] = useState<string | null>(null);
  const { run } = useActionLock();

  const validate = () => {
    const next: Partial<FormState> = {};
    if (form.name.trim().length < 2) next.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email.';
    if (form.subject.trim().length < 3) next.subject = 'Add a subject.';
    if (form.message.trim().length < 12) next.message = 'Message should be at least 12 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    void run(async () => {
      const record = await saveContact(form);
      setDone(record.id);
      setForm(empty);
    });
  };

  const field = (key: keyof FormState, label: string, as: 'input' | 'textarea' = 'input') => (
    <label className="field">
      {label}
      {as === 'textarea' ? (
        <textarea
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          rows={6}
        />
      ) : (
        <input
          value={form[key]}
          type={key === 'email' ? 'email' : 'text'}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      )}
      {errors[key] ? <span className="field-error">{errors[key]}</span> : null}
    </label>
  );

  return (
    <div className="page page--narrow">
      <header className="page-head">
        <p className="eyebrow">Studio desk</p>
        <h1>Get in Touch !</h1>
        <p className="lead">
          There is no mail server in this prototype. Valid messages are saved to IndexedDB on this
          computer only.
        </p>
      </header>

      <div className="contact-layout">
        <aside className="contact-details">
          <div className="contact-visual">
            <img
              className="contact-visual__image"
              src={contactAvatar}
              alt="Contact support gamer avatar"
            />
          </div>
          
          <h2>Let's Connect</h2>
          <p className="contact-lead">
            Love to talk about your next idea, partnership or support query.
          </p>

          <ul className="contact-list">
            <li>
              <span className="contact-label">Email</span>
              <a href="mailto:preetinegi28012005@gmail.com">preetinegi28012005@gmail.com</a>
            </li>
            <li>
              <span className="contact-label">Phone</span>
              <a href="tel:+917988550509">+91 79885 50509</a>
            </li>
            <li>
              <span className="contact-label">Location</span>
              <span>Gurugram, Haryana, India</span>
            </li>
          </ul>
        </aside>

        <div className="contact-form-card">
          <div className="contact-form-head">
            <h2>Send us a message</h2>
            <p>Have a question or an idea? We'd love to hear from you!</p>
          </div>
          <form className="contact-form" onSubmit={onSubmit} noValidate>
            {field('name', 'Name')}
            {field('email', 'Email')}
            {field('subject', 'Subject')}
            {field('message', 'Message', 'textarea')}
            <button type="submit" className="btn btn--primary">
              Save message locally
            </button>
          </form>
        </div>
      </div>

      {done ? (
        <p className="success" role="status">
          Message saved locally for this prototype. It was not emailed. Reference {done}.
        </p>
      ) : null}
    </div>
  );
}
