import {createContext, FunctionComponent, useState, useEffect} from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import Router from 'next/router'
import {supabase} from '../supabase'
import {useMessage} from '../message'
import {SupabaseAuthPayload} from './auth.types'
import { ROUTE_HOME, ROUTE_AUTH } from '../../config'


export type AuthContextProps = {
    signUp: (payload: SupabaseAuthPayload) => void,
    signIn: (payload: SupabaseAuthPayload) => void,
    signInWithGithub: () => void,
    loading: boolean
    user: User,
    signOut: () => void,
    loggedIn: boolean,
    userLoading: boolean
}

export const AuthContext = createContext<Partial<AuthContextProps>>({})

export const AuthProvider: FunctionComponent = ({
                                                    children,
                                                }) => {
    const [loading, setLoading] = useState(false)
    const {handleMessage} = useMessage()
    const [ user, setUser ] = useState<User>(null)
    const [ userLoading, setUserLoading ] = useState(true)
    const [ loggedIn, setLoggedin ] = useState(false)

    const signUp = async (payload: SupabaseAuthPayload) => {
        try {
            setLoading(true)
            const {error} = await supabase.auth.signUp(payload)
            if (error) {
                if (handleMessage) {
                    handleMessage({message: error.message, type: 'error'})
                }
            } else {
                handleMessage({
                    message: 'Signup successful. Please check your inbox for a confirmation email!',
                    type: 'success'
                })
            }
        } catch (error) {
            handleMessage({message: error.error_description || error, type: 'error'})
        } finally {
            setLoading(false)
        }
    }

    const signIn = async (payload: SupabaseAuthPayload) => {
        try {
            setLoading(true)
            const { error, user } = await supabase.auth.signIn(payload)
            if (error) {
                handleMessage({message: error.message, type: 'error'})
            } else {
                handleMessage({ message: `Welcome, ${user.email}`, type: 'success' })
            }
        } catch (error) {
            handleMessage({message: error.error_description || error, type: 'error'})
        } finally {
            setLoading(false)
        }
    }

    const signInWithGithub = async (evt) => {
        evt.preventDefault()
        await supabase.auth.signIn({ provider: 'github'}
            /*, { redirectTo: 'http://localhost:3000/test' }*/
        )
    }

    const signOut = async () => await supabase.auth.signOut()

    const setServerSession = async (event: AuthChangeEvent, session: Session) => {
        await fetch('/api/auth', {
            method: 'POST',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            credentials: 'same-origin',
            body: JSON.stringify({ event, session }),
        })
    }


    useEffect(() => {
        const user = supabase.auth.user()

        if (user) {
            setUser(user)
            setUserLoading(false)
            setLoggedin(true)
            Router.push(ROUTE_HOME)
        }

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('authListener', event, session)
                const user = session?.user! ?? null
                setUserLoading(false)
                await setServerSession(event, session)
                if (user) {
                    setUser(user)
                    setLoggedin(true)
                    Router.push(ROUTE_HOME)
                } else {
                    setUser(null)
                    Router.push(ROUTE_AUTH)
                }
            }
        )

        return () => {
            authListener.unsubscribe()
        }
    }, [])

    return (<AuthContext.Provider value={{
            user,
            signUp,
            signIn,
            signInWithGithub,
            signOut,
            loggedIn,
            loading,
            userLoading
        }}>
            {children}
        </AuthContext.Provider>
    )
}

// Event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'PASSWORD_RECOVERY'

/**
 * AuthListener is a component that listens for auth state changes and updates the context
 * Example:
 * authListener SIGNED_IN
 * access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNjQ2MjQzNjIyLCJzdWIiOiIxNmE4NmUwMy0yZGFkLTRmZDEtYTgzNy0xY2FmYmVhZjhiYjgiLCJlbWFpbCI6InRpbW5pcm1hbEBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQifQ.wH7JHmvWivENc5-LVCdLW7UOzM2FB7YjcwBMCvlVyaE"
 * expires_at: 1646243622
 * expires_in: 3600
 * refresh_token: "ukb0GK3Mk_5s-CPT2KKbkw"
 * token_type: "bearer"
 *
 * user:
 *
 * app_metadata: {provider: 'email', providers: Array(1)}
 * provider: "email"
 * providers: Array(1)
 * 0: "email"
 * length: 1
 *
 * aud: "authenticated"
 * confirmation_sent_at: "2022-03-02T13:37:34.942754Z"
 * confirmed_at: "2022-03-02T13:39:51.113245Z"
 * created_at: "2022-03-02T13:37:34.938955Z"
 * email: "timnirmal@gmail.com"
 * email_confirmed_at: "2022-03-02T13:39:51.113245Z"
 * id: "16a86e03-2dad-4fd1-a837-1cafbeaf8bb8"
 *
 * identities: [{…}]
 * 0:
 * created_at: "2022-03-02T13:37:34.941034Z"
 * id: "16a86e03-2dad-4fd1-a837-1cafbeaf8bb8"
 * identity_data: {sub: '16a86e03-2dad-4fd1-a837-1cafbeaf8bb8'}
 * last_sign_in_at: "2022-03-02T13:37:34.940993Z"
 * provider: "email"
 * updated_at: "2022-03-02T13:37:34.941036Z"
 * user_id: "16a86e03-2dad-4fd1-a837-1cafbeaf8bb8"
 *
 * last_sign_in_at: "2022-03-02T16:53:42.264066253Z"
 * phone: ""
 * role: "authenticated"
 * updated_at: "2022-03-02T16:53:42.265164Z"
 *
 * user_metadata:
 */