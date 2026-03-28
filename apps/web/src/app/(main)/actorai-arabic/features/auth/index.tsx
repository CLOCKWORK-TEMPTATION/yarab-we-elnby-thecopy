"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "../../context/AppContext";

export function LoginForm() {
  const { handleLogin, navigate } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🎭</div>
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription>سجل دخولك للوصول إلى حسابك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">البريد الإلكتروني</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">كلمة المرور</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            className="w-full"
            onClick={() => handleLogin(email, password)}
          >
            تسجيل الدخول
          </Button>
          <p className="text-sm text-gray-600">
            ليس لديك حساب؟{" "}
            <button
              onClick={() => navigate("register")}
              className="text-blue-600 hover:underline"
            >
              سجل الآن
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export function RegisterForm() {
  const { handleRegister, navigate } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🎭</div>
          <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
          <CardDescription>انضم إلينا وابدأ رحلة التطوير</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="register-name">الاسم الكامل</Label>
            <Input
              id="register-name"
              placeholder="أحمد محمد"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">البريد الإلكتروني</Label>
            <Input
              id="register-email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">كلمة المرور</Label>
            <Input
              id="register-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            className="w-full"
            onClick={() => handleRegister(name, email, password)}
          >
            إنشاء الحساب
          </Button>
          <p className="text-sm text-gray-600">
            لديك حساب بالفعل؟{" "}
            <button
              onClick={() => navigate("login")}
              className="text-blue-600 hover:underline"
            >
              سجل دخولك
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
