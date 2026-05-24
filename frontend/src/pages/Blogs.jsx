import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Calendar, Clock } from "lucide-react";

import { API_URL as API } from "../config";

export function Blogs() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let isMounted = true;
    axios.get(`${API}/blogs`).then((r) => {
      if (isMounted) setItems(r.data.results || []);
    });
    return () => {
      isMounted = false;
    };
  }, []);
  const [feature, ...rest] = items;
  return (
    <>
      <section className="pt-40 pb-12 section-pad bg-white" data-testid="blogs-hero">
        <div className="container-x">
          <div className="overline text-[var(--gold-deep)]">Journal</div>
          <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[0.95]">Notes from the <em className="text-[var(--gold-deep)]">desk.</em></h1>
        </div>
      </section>
      <section className="section-pad pt-0 bg-white">
        <div className="container-x">
          {feature && (
            <Link to={`/blogs/${feature.id}`} className="grid grid-cols-1 lg:grid-cols-12 gap-10 group" data-testid="blog-feature">
              <div className="lg:col-span-7 img-zoom aspect-[16/10]">
                <img src={feature.cover} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="lg:col-span-5 self-center">
                <div className="overline text-[var(--gold-deep)]">{feature.category}</div>
                <h2 className="font-display text-4xl md:text-5xl mt-4 leading-tight group-hover:text-[var(--gold-deep)] transition-colors">{feature.title}</h2>
                <p className="mt-5 text-[var(--ink-2)]">{feature.excerpt}</p>
                <div className="mt-6 flex gap-5 text-xs text-[var(--muted)] tabular">
                  <span className="flex items-center gap-1"><Calendar size={12} />{feature.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} />{feature.read_minutes} min read</span>
                </div>
                <div className="mt-6 link-gold inline-flex items-center gap-2">Read article <ArrowUpRight size={14} /></div>
              </div>
            </Link>
          )}

          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {rest.map((b) => (
              <Link to={`/blogs/${b.id}`} key={b.id} className="group" data-testid={`blog-${b.id}`}>
                <div className="aspect-[4/3] img-zoom"><img src={b.cover} alt="" className="w-full h-full object-cover" /></div>
                <div className="overline text-[var(--gold-deep)] mt-5">{b.category}</div>
                <h3 className="font-display text-2xl mt-2 group-hover:text-[var(--gold-deep)] transition-colors">{b.title}</h3>
                <p className="text-sm text-[var(--muted)] mt-2">{b.excerpt}</p>
                <div className="mt-4 flex gap-4 text-xs text-[var(--muted)] tabular">
                  <span>{b.author}</span><span>·</span><span>{b.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function BlogDetail() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  useEffect(() => {
    let isMounted = true;
    axios.get(`${API}/blogs/${id}`).then((r) => {
      if (isMounted) setB(r.data);
    }).catch(() => {
      if (isMounted) setB(null);
    });
    return () => {
      isMounted = false;
    };
  }, [id]);
  if (!b) return <div className="pt-40 section-pad container-x"><p>Loading…</p></div>;
  return (
    <>
      <section className="pt-32" data-testid="blog-detail">
        <div className="container-x px-5 lg:px-12">
          <Link to="/blogs" className="text-xs uppercase tracking-[0.22em] flex items-center gap-2 link-gold"><ArrowLeft size={14} />All articles</Link>
          <div className="overline text-[var(--gold-deep)] mt-10">{b.category}</div>
          <h1 className="font-display text-4xl md:text-6xl mt-4 leading-[1.05] max-w-4xl">{b.title}</h1>
          <div className="flex gap-5 text-sm text-[var(--muted)] mt-6 tabular">
            <span>{b.author}</span><span>·</span><span>{b.date}</span><span>·</span><span>{b.read_minutes} min read</span>
          </div>
        </div>
        <div className="container-x px-5 lg:px-12 mt-12">
          <div className="aspect-[16/9] img-zoom"><img src={b.cover} alt="" className="w-full h-full object-cover" /></div>
        </div>
        <div className="container-x px-5 lg:px-12 max-w-3xl mx-auto mt-16 pb-32">
          <p className="text-xl leading-relaxed first-letter:font-display first-letter:text-6xl first-letter:float-left first-letter:mr-3 first-letter:text-[var(--gold-deep)]">
            {b.content}
          </p>
          <p className="text-lg leading-relaxed mt-6 text-[var(--ink-2)]">
            Reach out to a Triad consultant for a personalised version of this analysis tailored to your portfolio, capital outlay, and timeline.
          </p>
          <Link to="/contact" className="btn-gold mt-10 inline-flex">Speak to a Consultant <ArrowUpRight size={14} /></Link>
        </div>
      </section>
    </>
  );
}
