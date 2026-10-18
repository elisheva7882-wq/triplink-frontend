import { CheckCircle2, CircleAlert, X } from 'lucide-react';
export default function Toast({toast,onClose}){if(!toast)return null;return <div className={`toast ${toast.type||'info'}`}>{toast.type==='success'?<CheckCircle2 size={20}/>:<CircleAlert size={20}/>}<span>{toast.message}</span><button onClick={onClose}><X size={17}/></button></div>}
