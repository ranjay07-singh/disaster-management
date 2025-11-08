package com.disaster.management.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authz -> authz
                // Public endpoints - no authentication required
                .requestMatchers("/health", "/health/**").permitAll()
                .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                
                // AWS Diagnostic endpoints - Allow public access for troubleshooting
                // TODO: Remove after fixing AWS credentials
                .requestMatchers("/aws-diagnostic/**").permitAll()
                
                // File upload endpoints - Allow public access
                // Note: context-path is /api, so Spring sees /files/** (not /api/files/**)
                .requestMatchers("/files/**").permitAll()
                
                // User profile endpoints - Allow public access for profile updates
                // TODO: Add Firebase authentication verification
                .requestMatchers("/users/**").permitAll()
                
                // All other API endpoints require authentication
                .anyRequest().authenticated()
            )
            .httpBasic(httpBasic -> {}); // Enable HTTP Basic Authentication
        
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        // Create in-memory users for testing
        UserDetails user = User.builder()
            .username("user")
            .password(passwordEncoder.encode("disaster123"))
            .roles("USER")
            .build();
            
        UserDetails admin = User.builder()
            .username("admin")
            .password(passwordEncoder.encode("admin123"))
            .roles("ADMIN", "USER")
            .build();

        return new InMemoryUserDetailsManager(user, admin);
    }
}
