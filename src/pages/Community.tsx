import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Newspaper, Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { formatRelativeTime } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

function Avatar({ name, image, size=36 }: { name?:string|null; image?:string|null; size?:number }) {
  if (image) return <img src={image} alt={name||""} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>;
  return <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg, #4CAF82, #2DD4BF)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:size*0.38, flexShrink:0 }}>{name?.[0]??""}</div>;
}

function PostCard({ post }: { post: any }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const utils = trpc.useUtils();

  const { data: likes } = trpc.community.getLikes.useQuery({ postId: post.id });
  const { data: comments = [] } = trpc.community.getComments.useQuery({ postId: post.id }, { enabled: showComments });

  const like = trpc.community.like.useMutation({ onSuccess: () => utils.community.getLikes.invalidate({ postId: post.id }) });
  const addComment = trpc.community.addComment.useMutation({
    onSuccess: () => { utils.community.getComments.invalidate({ postId: post.id }); setComment(""); },
  });
  const del = trpc.community.delete.useMutation({ onSuccess: () => utils.community.list.invalidate() });

  return (
    <div className="card" style={{ padding:"1.25rem" }}>
      <div style={{ display:"flex", gap:"0.875rem", marginBottom:"0.875rem" }}>
        <Avatar name={post.userName} image={post.userImage} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontWeight:600, fontSize:"0.875rem" }}>{post.userName}</span>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{formatRelativeTime(post.createdAt)}</span>
              {user?.id === post.userId && (
                <button onClick={() => del.mutate({ id: post.id })} style={{ background:"none", border:"none", cursor:"pointer", color:"#d1d5db", padding:"0.2rem", display:"flex" }}>
                  <Trash2 size={13}/>
                </button>
              )}
            </div>
          </div>
          <p style={{ margin:"0.4rem 0 0", fontSize:"0.9rem", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{post.content}</p>
        </div>
      </div>
      <div style={{ display:"flex", gap:"1rem", paddingTop:"0.75rem", borderTop:"1px solid var(--surface-2)" }}>
        <button onClick={() => like.mutate({ postId: post.id })}
          style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.8rem", color: likes?.userLiked ? "#F472B6" : "var(--text-muted)", fontWeight: likes?.userLiked ? 600 : 400, padding:0 }}>
          <Heart size={15} fill={likes?.userLiked ? "#F472B6" : "none"}/> {likes?.count ?? 0}
        </button>
        <button onClick={() => setShowComments(v=>!v)}
          style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.8rem", color:"var(--text-muted)", padding:0 }}>
          <MessageCircle size={15}/> {comments.length > 0 ? comments.length : "Comentar"}
        </button>
      </div>
      {showComments && (
        <div style={{ marginTop:"1rem" }}>
          {comments.map(c => (
            <div key={c.id} style={{ display:"flex", gap:"0.625rem", marginBottom:"0.625rem" }}>
              <Avatar name={c.userName} image={c.userImage} size={28}/>
              <div style={{ background:"var(--surface-2)", borderRadius:"0.75rem", padding:"0.5rem 0.75rem", flex:1 }}>
                <span style={{ fontWeight:600, fontSize:"0.75rem", display:"block", marginBottom:"0.2rem" }}>{c.userName}</span>
                <p style={{ margin:0, fontSize:"0.8rem" }}>{c.content}</p>
              </div>
            </div>
          ))}
          <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.625rem" }}>
            <Avatar name={user?.name} image={user?.image} size={28}/>
            <div style={{ flex:1, display:"flex", gap:"0.5rem" }}>
              <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Escreva um comentário..." onKeyDown={e=>{ if(e.key==="Enter"&&comment.trim()) addComment.mutate({postId:post.id,content:comment}); }}
                style={{ flex:1, padding:"0.5rem 0.75rem", border:"1.5px solid var(--border)", borderRadius:"99px", fontFamily:"'DM Sans', sans-serif", fontSize:"0.8rem", outline:"none" }}/>
              <button onClick={() => comment.trim() && addComment.mutate({postId:post.id,content:comment})}
                style={{ background:"var(--primary)", border:"none", borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"white", flexShrink:0 }}>
                <Send size={14}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  const [content, setContent] = useState("");
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: posts = [] } = trpc.community.list.useQuery();
  const create = trpc.community.create.useMutation({
    onSuccess: () => { utils.community.list.invalidate(); setContent(""); toast.success("Publicado!"); },
  });

  return (
    <div className="fade-in" style={{ maxWidth:680, margin:"0 auto" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ margin:"0 0 0.25rem", fontSize:"1.75rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:"#60A5FA", display:"flex", alignItems:"center", justifyContent:"center" }}><Newspaper size={24} color="white"/></div> Comunidade
        </h1>
        <p style={{ margin:0, color:"var(--text-muted)" }}>Compartilhe com a equipe</p>
      </div>

      {/* New post */}
      <div className="card" style={{ padding:"1.25rem", marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", gap:"0.875rem" }}>
          <Avatar name={user?.name} image={user?.image}/>
          <div style={{ flex:1 }}>
            <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="O que você quer compartilhar?"
              style={{ width:"100%", padding:"0.625rem", border:"1.5px solid var(--border)", borderRadius:"0.875rem", fontFamily:"'DM Sans', sans-serif", fontSize:"0.9rem", resize:"none", outline:"none", minHeight:80, boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor="var(--primary)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"0.625rem" }}>
              <button className="btn-primary" onClick={() => { if(content.trim()) create.mutate({content}); }} disabled={!content.trim() || create.isPending}
                style={{ background:"linear-gradient(135deg, #60A5FA, #3b82f6)" }}>
                {create.isPending ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
        {posts.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text-muted)" }}>
            <p style={{ fontSize:"3rem", margin:"0 0 1rem" }}>👥</p>
            <p>Nenhuma publicação ainda. Seja o primeiro!</p>
          </div>
        ) : posts.map(p => <PostCard key={p.id} post={p}/>)}
      </div>
    </div>
  );
}
