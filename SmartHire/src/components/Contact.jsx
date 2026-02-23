// src/components/Contact.jsx
import { API_BASE_URL } from "../utils/apiBaseUrl";

export default function Contact() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form[0].value;
    const email = form[1].value;
    const message = form[2].value;

    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();
      alert(data.message);
      form.reset();
    } catch (err) {
      alert("Failed to send message. Please try again later.");
      console.error(err);
    }
  };

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h2>
        <p className="text-gray-600 mb-12">
          Have questions? Our team is here to help.
        </p>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 text-left max-w-2xl mx-auto"
        >
          <input
            type="text"
            placeholder="Full Name"
            required
            className="p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="email"
            placeholder="Email Address"
            required
            className="p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <textarea
            rows="4"
            placeholder="Your Message"
            required
            className="p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          ></textarea>
          <button
            type="submit"
            className="py-4 px-8 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
