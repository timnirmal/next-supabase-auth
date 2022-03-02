import {createContext, FunctionComponent, useState} from 'react'
import {supabase} from '../supabase'
import {useMessage} from '../message'
import {SupabaseAuthPayload} from './auth.types'

export type AuthContextProps = {
    signUp: (payload: SupabaseAuthPayload) => void,
    signIn: (payload: SupabaseAuthPayload) => void,
    loading: boolean
}

export const AuthContext = createContext<Partial<AuthContextProps>>({})

export const AuthProvider: FunctionComponent = ({
                                                    children,
                                                }) => {
    const [loading, setLoading] = useState(false)
    const {handleMessage} = useMessage()

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
            const {error} = await supabase.auth.signIn(payload)
            if (error) {
                handleMessage({message: error.message, type: 'error'})
            } else {
                handleMessage({message: 'Log in successful. I\'ll redirect you once I\'m done', type: 'success'})
            }
        } catch (error) {
            handleMessage({message: error.error_description || error, type: 'error'})
        } finally {
            setLoading(false)
        }
    }

    return (<AuthContext.Provider value={{
            signUp,
            signIn,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    )
}