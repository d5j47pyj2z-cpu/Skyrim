import tkinter as tk
from tkinter import ttk, messagebox
import json, os, itertools

BASE=os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE,"ingredients_fr.json"),encoding="utf-8") as f: ING=json.load(f)
with open(os.path.join(BASE,"recipes_cuisine_fr.json"),encoding="utf-8") as f: FOOD=json.load(f)
SAVE=os.path.join(BASE,"progression.json")

if os.path.exists(SAVE):
    try:
        with open(SAVE,encoding="utf-8") as f: state=json.load(f)
    except: state={}
else: state={}
state.setdefault("ingredients",{})
state.setdefault("food",{})

for x in ING: x["possede"]=state["ingredients"].get(x["nom"],False)
for x in FOOD: x["fait"]=state["food"].get(x["nom"],False)

def save():
    state["ingredients"]={x["nom"]:x["possede"] for x in ING}
    state["food"]={x["nom"]:x["fait"] for x in FOOD}
    with open(SAVE,"w",encoding="utf-8") as f: json.dump(state,f,ensure_ascii=False,indent=2)

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Skyrim Alchimie & Cuisine — Français")
        self.geometry("1250x780"); self.minsize(1000,650); self.configure(bg="#0d1115")
        s=ttk.Style(self)
        try:s.theme_use("clam")
        except:pass
        s.configure("Treeview",background="#171d23",foreground="#eee7d8",fieldbackground="#171d23",rowheight=31)
        s.map("Treeview",background=[("selected","#35424e")])
        s.configure("Treeview.Heading",background="#252e36",foreground="#eadfc9")
        self.sidebar()
        self.body=tk.Frame(self,bg="#0d1115"); self.body.pack(side="right",fill="both",expand=True)
        self.dashboard()

    def sidebar(self):
        s=tk.Frame(self,bg="#080b0e",width=245); s.pack(side="left",fill="y"); s.pack_propagate(False)
        tk.Label(s,text="SKYRIM",bg="#080b0e",fg="#d8c59c",font=("Segoe UI",25,"bold")).pack(pady=(28,0))
        tk.Label(s,text="ALCHIMIE & CUISINE",bg="#080b0e",fg="#68747f",font=("Segoe UI",9,"bold")).pack(pady=(0,22))
        for t,c in [("⌂  Accueil",self.dashboard),("⚗  Alchimie",self.alchemy),("🥘  Cuisine",self.cooking),
                    ("🌿  Ingrédients",self.ingredients),("🔎  Trouver une potion",self.find_potion),
                    ("☑  Ma collection",self.collection)]:
            tk.Button(s,text=t,command=c,anchor="w",relief="flat",bd=0,bg="#080b0e",fg="#d5d0c6",
                      activebackground="#222a31",activeforeground="white",font=("Segoe UI",10),padx=20,pady=11).pack(fill="x")
        tk.Button(s,text="💾  Sauvegarder",command=self.save_now,bg="#172027",fg="#d8c59c",relief="flat",bd=0,
                  font=("Segoe UI",10,"bold"),padx=20,pady=13).pack(side="bottom",fill="x")

    def clear(self):
        for w in self.body.winfo_children(): w.destroy()
    def head(self,t,sub=""):
        tk.Label(self.body,text=t,bg="#0d1115",fg="#eee6d7",font=("Segoe UI",25,"bold")).pack(anchor="w",padx=36,pady=(27,2))
        if sub: tk.Label(self.body,text=sub,bg="#0d1115",fg="#77828c",font=("Segoe UI",10)).pack(anchor="w",padx=38,pady=(0,18))

    def dashboard(self):
        self.clear(); self.head("Alchimie & Cuisine","Guide français avec suivi de ta collection")
        ic=len(ING); ih=sum(x["possede"] for x in ING)
        fc=len(FOOD); fh=sum(x["fait"] for x in FOOD)
        for i,(a,b) in enumerate([("INGRÉDIENTS",f"{ih}/{ic}"),("RECETTES DE CUISINE",f"{fh}/{fc}")]):
            box=tk.Frame(self.body,bg="#181f26",height=110); box.pack(side="left",fill="x",expand=True,padx=10,pady=10)
            box.pack_propagate(False); tk.Label(box,text=a,bg="#181f26",fg="#7d8892",font=("Segoe UI",9,"bold")).pack(anchor="w",padx=18,pady=(18,2))
            tk.Label(box,text=b,bg="#181f26",fg="#e8dfcd",font=("Segoe UI",22,"bold")).pack(anchor="w",padx=18)
        tk.Label(self.body,text="Fonctionnement",bg="#0d1115",fg="#d8c59c",font=("Segoe UI",15,"bold")).pack(anchor="w",padx=38,pady=(28,7))
        tk.Label(self.body,text="• Alchimie : sélectionne 2 ou 3 ingrédients et l'application cherche les effets communs.\\n"
                 "• Cuisine : toutes les recettes enregistrées sont filtrables par station et par DLC.\\n"
                 "• Collection : coche les ingrédients et plats que tu possèdes ou as fabriqués.",
                 justify="left",bg="#0d1115",fg="#9aa3ab",font=("Segoe UI",10)).pack(anchor="w",padx=40)

    def alchemy(self):
        self.clear(); self.head("Alchimie","Choisis jusqu'à 3 ingrédients pour trouver les effets communs")
        names=[x["nom"] for x in ING]; vars=[]
        frame=tk.Frame(self.body,bg="#0d1115"); frame.pack(fill="x",padx=38)
        for i in range(3):
            v=tk.StringVar(); vars.append(v)
            cb=ttk.Combobox(frame,textvariable=v,values=names,width=35)
            cb.grid(row=0,column=i,padx=6,pady=8)
        result=tk.Text(self.body,height=18,bg="#151b21",fg="#e8e0d2",insertbackground="white",relief="flat",font=("Consolas",10))
        result.pack(fill="both",expand=True,padx=38,pady=18)
        def calc():
            chosen=[v.get() for v in vars if v.get() in names]
            result.delete("1.0","end")
            if len(chosen)<2:
                result.insert("end","Sélectionne au moins 2 ingrédients.")
                return
            sets=[set(next(x["effets"] for x in ING if x["nom"]==n)) for n in chosen]
            common=set.intersection(*sets)
            result.insert("end","Ingrédients : "+", ".join(chosen)+"\\n\\n")
            if common: result.insert("end","Effets communs :\\n• "+"\\n• ".join(sorted(common)))
            else: result.insert("end","Aucun effet commun : cette combinaison ne crée pas de potion/poison avec ces ingrédients.")
        tk.Button(frame,text="⚗ Trouver les effets",command=calc,bg="#303b45",fg="white",relief="flat",padx=15,pady=8).grid(row=1,column=0,columnspan=3,pady=8)

    def cooking(self):
        self.clear(); self.head("Cuisine","Recettes de marmite, four et moulin")
        self.recipe_table(FOOD)

    def recipe_table(self,items):
        search=tk.StringVar(); bar=tk.Frame(self.body,bg="#0d1115"); bar.pack(fill="x",padx=35)
        tk.Label(bar,text="Recherche :",bg="#0d1115",fg="#89939c").pack(side="left")
        tk.Entry(bar,textvariable=search,bg="#202830",fg="white",insertbackground="white",relief="flat",width=35).pack(side="left",padx=10)
        tree=ttk.Treeview(self.body,columns=("done","name","station","source","ingredients","effect"),show="headings")
        for c,h,w in [("done","Fait",60),("name","Recette",220),("station","Station",100),("source","DLC / jeu",120),("ingredients","Ingrédients",360),("effect","Effet",300)]:
            tree.heading(c,text=h); tree.column(c,width=w)
        tree.pack(fill="both",expand=True,padx=35,pady=12)
        def refresh(*_):
            tree.delete(*tree.get_children()); q=search.get().lower()
            for i,x in enumerate(items):
                txt=(x["nom"]+" "+" ".join(x["ingredients"])+" "+x["source"]).lower()
                if q and q not in txt: continue
                tree.insert("", "end",iid=str(i),values=("☑" if x["fait"] else "☐",x["nom"],x["station"],x["source"],", ".join(x["ingredients"]),x["effet"]))
        def toggle():
            s=tree.selection()
            if not s:return
            items[int(s[0])]["fait"]=not items[int(s[0])]["fait"]; save(); refresh()
        search.trace_add("write",refresh)
        tk.Button(self.body,text="☑ Marquer la recette comme faite",command=toggle,bg="#303b45",fg="white",relief="flat",padx=14,pady=8).pack(anchor="w",padx=35,pady=(0,15))
        refresh()

    def ingredients(self):
        self.clear(); self.head("Ingrédients","Effets, source et suivi de possession")
        search=tk.StringVar(); tk.Entry(self.body,textvariable=search,bg="#202830",fg="white",insertbackground="white",relief="flat",width=40).pack(anchor="w",padx=35)
        tree=ttk.Treeview(self.body,columns=("got","name","source","effects"),show="headings")
        for c,h,w in [("got","Possédé",70),("name","Ingrédient",230),("source","Source",150),("effects","4 effets",650)]:
            tree.heading(c,text=h); tree.column(c,width=w)
        tree.pack(fill="both",expand=True,padx=35,pady=12)
        def refresh(*_):
            tree.delete(*tree.get_children()); q=search.get().lower()
            for i,x in enumerate(ING):
                if q and q not in (x["nom"]+" "+" ".join(x["effets"])+" "+x["source"]).lower():continue
                tree.insert("", "end",iid=str(i),values=("☑" if x["possede"] else "☐",x["nom"],x["source"]," • ".join(x["effets"])))
        def toggle():
            s=tree.selection()
            if not s:return
            ING[int(s[0])]["possede"]=not ING[int(s[0])]["possede"]; save(); refresh()
        search.trace_add("write",refresh)
        tk.Button(self.body,text="☑ Marquer comme possédé",command=toggle,bg="#303b45",fg="white",relief="flat",padx=14,pady=8).pack(anchor="w",padx=35,pady=(0,15))
        refresh()

    def find_potion(self):
        self.clear(); self.head("Trouver une potion / un poison","Choisis un effet : l'application liste les combinaisons de 2 ou 3 ingrédients possibles")
        effects=sorted({e for x in ING for e in x["effets"]}); v=tk.StringVar()
        ttk.Combobox(self.body,textvariable=v,values=effects,width=55).pack(anchor="w",padx=38,pady=8)
        out=ttk.Treeview(self.body,columns=("ingredients","effect"),show="headings")
        out.heading("ingredients",text="Combinaison"); out.heading("effect",text="Effet commun")
        out.column("ingredients",width=600); out.column("effect",width=400)
        out.pack(fill="both",expand=True,padx=38,pady=15)
        def search():
            out.delete(*out.get_children()); wanted=v.get()
            if not wanted:return
            for r in (2,3):
                for combo in itertools.combinations(ING,r):
                    common=set(combo[0]["effets"])
                    for x in combo[1:]: common &= set(x["effets"])
                    if wanted in common:
                        out.insert("", "end",values=(" + ".join(x["nom"] for x in combo),wanted))
        tk.Button(self.body,text="🔎 Chercher",command=search,bg="#303b45",fg="white",relief="flat",padx=16,pady=8).pack(anchor="w",padx=38)

    def collection(self):
        self.clear(); self.head("Ma collection","Résumé de ce que tu as découvert / fabriqué")
        ih=sum(x["possede"] for x in ING); fh=sum(x["fait"] for x in FOOD)
        tk.Label(self.body,text=f"Ingrédients possédés : {ih}/{len(ING)}\\nRecettes réalisées : {fh}/{len(FOOD)}",
                 bg="#0d1115",fg="#ddd4c4",font=("Segoe UI",15),justify="left").pack(anchor="w",padx=40,pady=20)

    def save_now(self):
        save(); messagebox.showinfo("Skyrim","Progression sauvegardée.")

if __name__=="__main__": App().mainloop()
