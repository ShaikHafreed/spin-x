import PropTypes from 'prop-types'

export default function AuthView({
  mode,
  setMode,
  showForgotPassword,
  setShowForgotPassword,
  clearMessages,
  handleSignup,
  handleLogin,
  handleForgotPassword,
  signupForm,
  loginForm,
  forgotPasswordForm,
  updateSignupForm,
  updateLoginForm,
  updateForgotPasswordForm,
  error,
  success,
}) {
  return (
    <main className="app-shell auth-shell">
      <div className="auth-background" aria-hidden="true">
        <div className="pitch-ring ring-one"></div>
        <div className="pitch-ring ring-two"></div>
        <div className="football-ball ball-one"></div>
        <div className="football-ball ball-two"></div>
      </div>

      <section className="panel auth-panel">
        <div className="brand-block">
          <p className="brand-tag">Football Performance Platform</p>
          <h1>spin-x</h1>
          <p className="subheading">Sign up or log in as a coach or student</p>
        </div>

        <div className="mode-switch" role="tablist" aria-label="Authentication mode">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login')
              setShowForgotPassword(false)
              clearMessages()
            }}
          >
            Login
          </button>
          <button
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => {
              setMode('signup')
              setShowForgotPassword(false)
              clearMessages()
            }}
          >
            Sign Up
          </button>
        </div>

        {mode === 'signup' ? (
          <form className="auth-form" onSubmit={handleSignup}>
            <label>
              <span>Full name</span>
              <input
                type="text"
                value={signupForm.name}
                onChange={(event) => updateSignupForm('name', event.target.value)}
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={signupForm.email}
                onChange={(event) => updateSignupForm('email', event.target.value)}
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={signupForm.password}
                onChange={(event) => updateSignupForm('password', event.target.value)}
              />
            </label>

            <label>
              <span>Role</span>
              <select
                value={signupForm.role}
                onChange={(event) => updateSignupForm('role', event.target.value)}
              >
                <option value="student">Student</option>
                <option value="coach">Coach</option>
              </select>
            </label>

            <button type="submit" className="primary-button">
              Create account
            </button>
          </form>
        ) : (
          <>
            {showForgotPassword ? (
              <form className="auth-form" onSubmit={handleForgotPassword}>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={forgotPasswordForm.email}
                    onChange={(event) => updateForgotPasswordForm('email', event.target.value)}
                  />
                </label>

                <label>
                  <span>New password</span>
                  <input
                    type="password"
                    value={forgotPasswordForm.newPassword}
                    onChange={(event) => updateForgotPasswordForm('newPassword', event.target.value)}
                  />
                </label>

                <label>
                  <span>Confirm password</span>
                  <input
                    type="password"
                    value={forgotPasswordForm.confirmPassword}
                    onChange={(event) => updateForgotPasswordForm('confirmPassword', event.target.value)}
                  />
                </label>

                <button type="submit" className="primary-button">
                  Reset password
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    clearMessages()
                  }}
                >
                  Back to login
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleLogin}>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => updateLoginForm('email', event.target.value)}
                  />
                </label>

                <label>
                  <span>Password</span>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => updateLoginForm('password', event.target.value)}
                  />
                </label>

                <button type="submit" className="primary-button">
                  Log in
                </button>

                <button
                  type="button"
                  className="secondary-button auth-inline-action"
                  onClick={() => {
                    setShowForgotPassword(true)
                    clearMessages()
                  }}
                >
                  Forgot password?
                </button>
              </form>
            )}
          </>
        )}

        {error && <p className="message error">{error}</p>}
        {success && <p className="message success">{success}</p>}
      </section>
    </main>
  )
}

AuthView.propTypes = {
  mode: PropTypes.oneOf(['login', 'signup']).isRequired,
  setMode: PropTypes.func.isRequired,
  showForgotPassword: PropTypes.bool.isRequired,
  setShowForgotPassword: PropTypes.func.isRequired,
  clearMessages: PropTypes.func.isRequired,
  handleSignup: PropTypes.func.isRequired,
  handleLogin: PropTypes.func.isRequired,
  handleForgotPassword: PropTypes.func.isRequired,
  signupForm: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['coach', 'student']).isRequired,
  }).isRequired,
  loginForm: PropTypes.shape({
    email: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired,
  }).isRequired,
  forgotPasswordForm: PropTypes.shape({
    email: PropTypes.string.isRequired,
    newPassword: PropTypes.string.isRequired,
    confirmPassword: PropTypes.string.isRequired,
  }).isRequired,
  updateSignupForm: PropTypes.func.isRequired,
  updateLoginForm: PropTypes.func.isRequired,
  updateForgotPasswordForm: PropTypes.func.isRequired,
  error: PropTypes.string.isRequired,
  success: PropTypes.string.isRequired,
}
