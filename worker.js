const cors = (origin, env) => {
  const allowed = (env.ALLOWED_ORIGINS || "https://zahr4family-sudo.github.io").split(",").map(x=>x.trim());
  return allowed.includes(origin) ? origin : allowed[0];
};
const json = (data, status=200, origin="*", extra={}) => new Response(JSON.stringify(data), {
  status, headers: {"content-type":"application/json; charset=utf-8","access-control-allow-origin":origin,
    "access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"Content-Type,Authorization",
    "access-control-max-age":"86400","vary":"Origin",...extra}
});
const sha = async s => [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("");
const token = n => { const a=new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(x=>x.toString(16).padStart(2,"0")).join(""); };
const clean = (v,n=160) => String(v??"").trim().slice(0,n);
async function sendOtp(env, channel, target, code) {
  if(channel==="email") {
    if(!env.RESEND_API_KEY || !env.OTP_FROM_EMAIL) throw new Error("Email OTP belum dikonfigurasi admin.");
    const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({from:env.OTP_FROM_EMAIL,to:[target],subject:"Kode verifikasi KAU",text:"Kode OTP KAU Anda: "+code+". Berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun."})});
    if(!r.ok) throw new Error("Layanan email OTP gagal mengirim.");
    return;
  }
  if(channel==="whatsapp") {
    if(!env.FONNTE_TOKEN) throw new Error("WhatsApp OTP belum dikonfigurasi admin.");
    const body=new URLSearchParams({target,message:"Kode OTP KAU: "+code+". Berlaku 5 menit. Jangan bagikan kode ini."});
    const r=await fetch("https://api.fonnte.com/send",{method:"POST",headers:{Authorization:env.FONNTE_TOKEN},body});
    if(!r.ok) throw new Error("Layanan WhatsApp OTP gagal mengirim.");
    return;
  }
  throw new Error("Saluran OTP tidak valid.");
}
export default {
 async fetch(request,env) {
  const origin=cors(request.headers.get("Origin")||"",env);
  if(request.method==="OPTIONS") return new Response(null,{status:204,headers:{"access-control-allow-origin":origin,"access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"Content-Type,Authorization","vary":"Origin"}});
  const url=new URL(request.url), path=url.pathname.replace(/\/+$/,"")||"/";
  try {
   if(path==="/" || path==="/health") return json({service:"KAU Access API",status:"online",version:"0.1.0",database:!!env.DB},200,origin);
   if(!env.DB) return json({error:"Database D1 belum terhubung."},503,origin);
   if(request.method!=="POST") return json({error:"Method tidak didukung."},405,origin);
   const body=await request.json();
   if(path==="/api/otp/request") {
    const channel=body.channel==="whatsapp"?"whatsapp":"email";
    const target=clean(body.target,180).toLowerCase();
    if(!target || (channel==="email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) || (channel==="whatsapp" && !/^\+?[0-9]{9,15}$/.test(target))) return json({error:"Alamat email/nomor WhatsApp tidak valid."},400,origin);
    const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,"0"), id=token(16);
    await env.DB.prepare("DELETE FROM otp_challenges WHERE target=? OR expires_at < ?").bind(target,Date.now()).run();
    await env.DB.prepare("INSERT INTO otp_challenges(id,target,channel,code_hash,expires_at,attempts,created_at) VALUES(?,?,?,?,?,0,?)")
      .bind(id,target,channel,await sha(code+env.OTP_PEPPER),Date.now()+300000,Date.now()).run();
    await sendOtp(env,channel,target,code);
    return json({ok:true,message:"OTP dikirim. Berlaku 5 menit.",challengeId:id},200,origin);
   }
   if(path==="/api/otp/verify") {
    const id=clean(body.challengeId,80), code=clean(body.code,6);
    const row=await env.DB.prepare("SELECT * FROM otp_challenges WHERE id=?").bind(id).first();
    if(!row || row.expires_at<Date.now() || row.attempts>=5) return json({error:"OTP kedaluwarsa atau percobaan habis."},400,origin);
    if(await sha(code+env.OTP_PEPPER)!==row.code_hash) {
      await env.DB.prepare("UPDATE otp_challenges SET attempts=attempts+1 WHERE id=?").bind(id).run();
      return json({error:"Kode OTP salah."},400,origin);
    }
    await env.DB.prepare("DELETE FROM otp_challenges WHERE id=?").bind(id).run();
    const verification=token(24);
    await env.DB.prepare("INSERT INTO verified_contacts(token_hash,target,channel,expires_at,created_at) VALUES(?,?,?,?,?)")
      .bind(await sha(verification),row.target,row.channel,Date.now()+900000,Date.now()).run();
    return json({ok:true,verificationToken:verification,masked:row.channel==="email"?row.target.replace(/^(.).+(@.*)$/,"$1***$2"):row.target.slice(0,4)+"****"+row.target.slice(-3)},200,origin);
   }
   if(path==="/api/register") {
    const vt=clean(body.verificationToken,120), contact=await env.DB.prepare("SELECT * FROM verified_contacts WHERE token_hash=? AND expires_at>?").bind(await sha(vt),Date.now()).first();
    if(!contact) return json({error:"Verifikasi kontak diperlukan atau telah kedaluwarsa."},401,origin);
    const teacherName=clean(body.teacherName,120), school=clean(body.school,160), nip=clean(body.nip,40), role=body.subject==="PAI"?"PAI":"NON_PAI";
    const subject=clean(body.subject,80), className=clean(body.className,80), deviceId=clean(body.deviceId,128);
    if(!teacherName||!school||!subject||!deviceId||(role==="NON_PAI"&&!className)) return json({error:"Nama guru, sekolah, mapel, kelas, dan identitas perangkat wajib diisi sesuai ketentuan."},400,origin);
    const existing=await env.DB.prepare("SELECT * FROM teachers WHERE contact=?").bind(contact.target).first();
    if(existing) return json({error:"Kontak ini sudah terdaftar. Ajukan penambahan akses melalui admin."},409,origin);
    const id=token(16), deviceHash=await sha(deviceId);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO teachers(id,teacher_name,school,nip,contact,contact_channel,role,locked_subject,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
       .bind(id,teacherName,school,nip,contact.target,contact.channel,role,role==="PAI"?"PAI":subject,"PENDING",Date.now()),
      env.DB.prepare("INSERT INTO access_grants(id,teacher_id,subject,class_name,created_at) VALUES(?,?,?,?,?)")
       .bind(token(12),id,subject,role==="PAI"?(className||"*"):className,Date.now()),
      env.DB.prepare("INSERT INTO devices(id,teacher_id,device_hash,status,created_at) VALUES(?,?,?,?,?)")
       .bind(token(12),id,deviceHash,"PENDING",Date.now()),
      env.DB.prepare("DELETE FROM verified_contacts WHERE token_hash=?").bind(await sha(vt))
    ]);
    return json({ok:true,status:"PENDING",message:"Pendaftaran diterima dan menunggu persetujuan admin."},201,origin);
   }
   return json({error:"Endpoint tidak ditemukan."},404,origin);
  } catch(e) { return json({error:e.message||"Kesalahan server."},500,origin); }
 }
};